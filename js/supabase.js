/**
 * MVJ INTERDEPARTMENT SPORTS - DATABASE & SUPABASE REALTIME LAYER
 * MVJ College of Engineering
 * 
 * Provides unified data access for both live Supabase PostgreSQL
 * and local offline-first persistent storage.
 */

(function () {
  'use strict';

  const STORAGE_KEYS = {
    DEPARTMENTS: 'MVJ_DB_DEPARTMENTS',
    SPORTS: 'MVJ_DB_SPORTS',
    MATCHES: 'MVJ_DB_MATCHES',
    ANNOUNCEMENTS: 'MVJ_DB_ANNOUNCEMENTS',
    SETTINGS: 'MVJ_DB_SETTINGS'
  };

  class SportsDatabase {
    constructor() {
      this.supabase = null;
      this.isSupabaseActive = false;
      this.listeners = new Set();
      this.init();
    }

    init() {
      // 1. Initialize local cache from seed data if not present
      this.initLocalStore();

      // 2. Initialize Supabase if credentials are valid
      this.initSupabaseClient();

      // 3. Listen to local storage events for multi-tab sync
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('MVJ_DB_')) {
          this.notifyListeners({ source: 'localStorage', key: e.key });
        }
      });

      window.addEventListener('online', () => {
        this.notifyListeners({ source: 'online' });
      });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.notifyListeners({ source: 'visibility' });
        }
      });
    }

    initLocalStore() {
      if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
        localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(window.MVJ_CONFIG.DEPARTMENTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SPORTS)) {
        localStorage.setItem(STORAGE_KEYS.SPORTS, JSON.stringify(window.MVJ_CONFIG.SPORTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
        localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(window.MVJ_CONFIG.MATCHES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(window.MVJ_CONFIG.ANNOUNCEMENTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        const settings = {
          tournament_name: window.MVJ_CONFIG.PORTAL_TITLE,
          academic_year: window.MVJ_CONFIG.ACADEMIC_YEAR,
          tournament_status: window.MVJ_CONFIG.TOURNAMENT_STATUS,
          homepage_tagline: window.MVJ_CONFIG.TAGLINE,
          homepage_subtitle: window.MVJ_CONFIG.SUBTITLE,
          logo_path: window.MVJ_CONFIG.LOGO_PATH
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      }
    }

    getSupabaseCredentials() {
      const config = window.MVJ_CONFIG || {};
      const savedUrl = (localStorage.getItem('MVJ_SUPABASE_URL') || '').trim();
      const savedKey = (localStorage.getItem('MVJ_SUPABASE_ANON_KEY') || '').trim();
      return {
        url: savedUrl || (config.SUPABASE_URL || '').trim(),
        key: savedKey || (config.SUPABASE_ANON_KEY || '').trim()
      };
    }

    generateUuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    async canWriteToSupabase() {
      if (!this.supabase) return false;
      try {
        const { data: { session } = {} } = await this.supabase.auth.getSession();
        return Boolean(session);
      } catch (err) {
        console.warn('Supabase auth session check failed:', err);
        return false;
      }
    }

    async requireSupabaseWriteAccess() {
      if (!this.isSupabaseActive || !this.supabase) return false;
      if (!(await this.canWriteToSupabase())) {
        throw new Error('A Supabase admin session is required to sync changes across devices.');
      }
      return true;
    }

    async writeToSupabase(table, action, id, values) {
      if (!(await this.requireSupabaseWriteAccess())) return false;

      try {
        let query = this.supabase.from(table);
        if (action === 'insert') {
          query = query.insert([values]);
        } else if (action === 'update') {
          query = query.update(values).eq('id', id);
        } else {
          query = query.delete().eq('id', id);
        }

        const { error } = await query;
        if (error) throw error;
        return true;
      } catch (error) {
        console.error(`Supabase ${action} failed for ${table}:`, error);
        throw error;
      }
    }

    initSupabaseClient() {
      const { url, key } = this.getSupabaseCredentials();
      const isValidUrl = Boolean(url && url.startsWith('https://') && !url.includes('xyzcompany'));
      const isValidKey = Boolean(key && key.length > 20 && !key.includes('placeholder'));

      if (window.supabase && isValidUrl && isValidKey) {
        try {
          this.supabase = window.supabase.createClient(url, key);
          this.isSupabaseActive = true;
          console.info('Connected to Supabase at:', url);
          this.setupSupabaseRealtime();
        } catch (err) {
          console.warn('Supabase initialization failed, falling back to local sync:', err);
          this.isSupabaseActive = false;
          this.supabase = null;
        }
      } else {
        this.isSupabaseActive = false;
        this.supabase = null;
      }
    }

    setupSupabaseRealtime() {
      if (!this.supabase) return;

      try {
        const channel = this.supabase
          .channel('mvj-sports-realtime')
          .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            console.log('Realtime change received from Supabase:', payload);
            this.notifyListeners({ source: 'supabase-realtime', payload });
          })
          .subscribe((status, error) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              console.warn('Supabase realtime subscription failed:', error || status);
            }
          });
      } catch (e) {
        console.warn('Realtime subscription error:', e);
      }
    }

    subscribe(callback) {
      if (typeof callback === 'function') {
        this.listeners.add(callback);
      }
      return () => this.listeners.delete(callback);
    }

    notifyListeners(detail = {}) {
      this.listeners.forEach((cb) => {
        try {
          cb(detail);
        } catch (err) {
          console.error('Error in listener callback:', err);
        }
      });
      // Also dispatch DOM event
      window.dispatchEvent(new CustomEvent('mvj_data_updated', { detail }));
    }

    // -------------------------------------------------------------
    // DEPARTMENTS
    // -------------------------------------------------------------
    
    async getDepartments() {
      if (this.isSupabaseActive && this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('departments')
            .select('*')
            .order('points', { ascending: false });
          if (error) throw error;

          const departments = this.sortDepartments(data || []);
          localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments));
          return departments;
        } catch (error) {
          console.warn('Supabase getDepartments error, fallback local:', error);
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      return this.sortDepartments(raw ? JSON.parse(raw) : (window.MVJ_CONFIG.DEPARTMENTS || []));
    }

    // Tie-breaker: Points -> Gold -> Silver -> Bronze
    sortDepartments(list) {
      return [...list].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.silver !== a.silver) return b.silver - a.silver;
        return (b.bronze || 0) - (a.bronze || 0);
      });
    }

    async addDepartment(dept) {
      const newDept = {
        id: dept.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(dept.id) ? dept.id : this.generateUuid(),
        name: dept.name,
        code: dept.code || dept.name.substring(0, 4).toUpperCase(),
        points: parseInt(dept.points, 10) || 0,
        gold: parseInt(dept.gold, 10) || 0,
        silver: parseInt(dept.silver, 10) || 0,
        bronze: parseInt(dept.bronze, 10) || 0,
        color: dept.color || this.getRandomColor()
      };

      await this.writeToSupabase('departments', 'insert', newDept.id, newDept);
      const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      const list = raw ? JSON.parse(raw) : [];
      list.push(newDept);
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(this.sortDepartments(list)));
      this.notifyListeners({ action: 'addDepartment', item: newDept });
      return newDept;
    }

    async updateDepartment(id, updates) {
      await this.writeToSupabase('departments', 'update', id, updates);

      const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      let list = raw ? JSON.parse(raw) : [];
      list = list.map((d) => (d.id === id ? { ...d, ...updates } : d));
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'updateDepartment', id, updates });
      return true;
    }

    async deleteDepartment(id) {
      await this.writeToSupabase('departments', 'delete', id);

      const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      let list = raw ? JSON.parse(raw) : [];
      list = list.filter((d) => d.id !== id);
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'deleteDepartment', id });
      return true;
    }

    // -------------------------------------------------------------
    // SPORTS
    // -------------------------------------------------------------
    
    async getSports() {
      if (this.isSupabaseActive && this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('sports')
            .select('*')
            .order('name', { ascending: true });
          if (error) throw error;

          const sports = data || [];
          localStorage.setItem(STORAGE_KEYS.SPORTS, JSON.stringify(sports));
          return sports;
        } catch (error) {
          console.warn('Supabase getSports error, fallback local:', error);
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.SPORTS);
      return raw ? JSON.parse(raw) : (window.MVJ_CONFIG.SPORTS || []);
    }


    async getSportBySlug(slug) {
      const sports = await this.getSports();
      return sports.find(
        (s) => s.slug?.toLowerCase() === slug?.toLowerCase() || s.id === slug
      );
    }

    async addSport(sport) {
      const slug = (sport.slug || sport.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/^-|-$/g, '');
      const newSport = {
        id: sport.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sport.id) ? sport.id : this.generateUuid(),
        name: sport.name,
        slug: slug,
        icon: sport.icon || 'fa-trophy',
        image: sport.image || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
        description: sport.description || '',
        current_stage: sport.current_stage || 'Upcoming'
      };

      await this.writeToSupabase('sports', 'insert', newSport.id, newSport);
      const raw = localStorage.getItem(STORAGE_KEYS.SPORTS);
      const list = raw ? JSON.parse(raw) : [];
      list.push(newSport);
      localStorage.setItem(STORAGE_KEYS.SPORTS, JSON.stringify(list));
      this.notifyListeners({ action: 'addSport', item: newSport });
      return newSport;
    }

    async updateSport(id, updates) {
      await this.writeToSupabase('sports', 'update', id, updates);

      const raw = localStorage.getItem(STORAGE_KEYS.SPORTS);
      let list = raw ? JSON.parse(raw) : [];
      list = list.map((s) => (s.id === id ? { ...s, ...updates } : s));
      localStorage.setItem(STORAGE_KEYS.SPORTS, JSON.stringify(list));
      this.notifyListeners({ action: 'updateSport', id, updates });
      return true;
    }

    async deleteSport(id) {
      // Check for associated matches first
      const matches = await this.getMatches();
      const sport = (await this.getSports()).find((s) => s.id === id);
      const associated = matches.filter(
        (m) => m.sport_id === id || (sport && m.sport_slug === sport.slug)
      );

      if (associated.length > 0) {
        throw new Error(
          `Cannot delete sport "${sport ? sport.name : id}" because it has ${associated.length} associated match(es). Please delete or reassign matches first.`
        );
      }

      await this.writeToSupabase('sports', 'delete', id);

      const raw = localStorage.getItem(STORAGE_KEYS.SPORTS);
      let list = raw ? JSON.parse(raw) : [];
      list = list.filter((s) => s.id !== id);
      localStorage.setItem(STORAGE_KEYS.SPORTS, JSON.stringify(list));
      this.notifyListeners({ action: 'deleteSport', id });
      return true;
    }

    // -------------------------------------------------------------
    // MATCHES
    // -------------------------------------------------------------
    async getMatches(filters = {}) {
      let matches = [];
      let loadedFromSupabase = false;
      if (this.isSupabaseActive && this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('matches')
            .select('*, sports(slug)');
          if (error) throw error;
          matches = (data || []).map((match) => {
            const sport = Array.isArray(match.sports) ? match.sports[0] : match.sports;
            const normalizedMatch = { ...match, sport_slug: match.sport_slug || sport?.slug || '' };
            delete normalizedMatch.sports;
            return normalizedMatch;
          });
          localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(matches));
          loadedFromSupabase = true;
        } catch (err) {
          console.warn('Supabase getMatches error, fallback local:', err);
        }
      }

      if (!loadedFromSupabase) {
        const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
        matches = raw ? JSON.parse(raw) : window.MVJ_CONFIG.MATCHES;
      }

      // Apply client-side filters
      if (filters.sport_id && filters.sport_id !== 'All') {
        matches = matches.filter((m) => m.sport_id === filters.sport_id);
      }
      if (filters.sport_slug) {
        matches = matches.filter(
          (m) => m.sport_slug?.toLowerCase() === filters.sport_slug.toLowerCase()
        );
      }
      if (filters.stage && filters.stage !== 'All') {
        matches = matches.filter((m) => m.stage === filters.stage);
      }
      if (filters.status && filters.status !== 'All') {
        matches = matches.filter((m) => m.status === filters.status);
      }
      if (filters.team) {
        const term = filters.team.toLowerCase();
        matches = matches.filter(
          (m) =>
            m.team_a?.toLowerCase().includes(term) ||
            m.team_b?.toLowerCase().includes(term)
        );
      }

      return matches;
    }

    async addMatch(match) {
      let sportId = match.sport_id || null;
      if (!sportId && match.sport_slug) {
        const sports = this.isSupabaseActive && this.supabase
          ? await this.getSports()
          : JSON.parse(localStorage.getItem(STORAGE_KEYS.SPORTS) || '[]');
        const sport = sports.find((s) => s.slug?.toLowerCase() === match.sport_slug.toLowerCase());
        sportId = sport?.id || null;
      }

      const newMatch = {
        id: match.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(match.id) ? match.id : this.generateUuid(),
        sport_slug: match.sport_slug || 'cricket',
        sport_id: sportId,
        stage: match.stage || 'Regular',
        stage_label: match.stage_label || (match.stage === 'Regular' ? 'Match' : match.stage),
        team_a: match.team_a || 'TBD',
        team_b: match.team_b || 'TBD',
        team_a_logo: match.team_a_logo || '',
        team_b_logo: match.team_b_logo || '',
        score_a: match.score_a || '-',
        score_b: match.score_b || '-',
        match_date: match.match_date || new Date().toISOString().split('T')[0],
        match_time: match.match_time || '10:00 AM',
        venue: match.venue || 'MVJ College Ground',
        status: match.status || 'Upcoming',
        winner: match.winner || '',
        result: match.result || ''
      };

      if (await this.requireSupabaseWriteAccess()) {
        try {
          const supabaseMatch = { ...newMatch };
          delete supabaseMatch.sport_slug;
          const { error } = await this.supabase.from('matches').insert([supabaseMatch]);
          if (error) throw error;
        } catch (e) {
          console.error('Supabase addMatch failed:', e);
          throw e;
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
      const list = raw ? JSON.parse(raw) : [];
      list.push(newMatch);
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
      this.notifyListeners({ action: 'addMatch', item: newMatch });
      return newMatch;
    }

    async updateMatch(id, updates) {
      if (await this.requireSupabaseWriteAccess()) {
        try {
          const { error } = await this.supabase.from('matches').update(updates).eq('id', id);
          if (error) throw error;
        } catch (e) {
          console.error('Supabase updateMatch failed:', e);
          throw e;
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
      let list = raw ? JSON.parse(raw) : [];
      list = list.map((m) => (m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m));
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
      this.notifyListeners({ action: 'updateMatch', id, updates });
      return true;
    }

    async deleteMatch(id) {
      if (await this.requireSupabaseWriteAccess()) {
        try {
          const { error } = await this.supabase.from('matches').delete().eq('id', id);
          if (error) throw error;
        } catch (e) {
          console.error('Supabase deleteMatch failed:', e);
          throw e;
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
      let list = raw ? JSON.parse(raw) : [];
      list = list.filter((m) => m.id !== id);
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
      this.notifyListeners({ action: 'deleteMatch', id });
      return true;
    }

    // -------------------------------------------------------------
    // ANNOUNCEMENTS
    // -------------------------------------------------------------
    async getAnnouncements(publishedOnly = true) {
      if (this.isSupabaseActive && this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;

          const announcements = data || [];
          localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
          return publishedOnly
            ? announcements.filter((a) => a.is_published !== false)
            : announcements;
        } catch (e) {
          console.warn('Supabase getAnnouncements error, fallback local:', e);
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      let list = raw ? JSON.parse(raw) : window.MVJ_CONFIG.ANNOUNCEMENTS;
      if (publishedOnly) {
        list = list.filter((a) => a.is_published !== false);
      }
      return list;
    }

    async addAnnouncement(item) {
      const newAnn = {
        id: item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id) ? item.id : this.generateUuid(),
        title: item.title,
        description: item.description,
        category: item.category || 'General',
        publish_date: item.publish_date || new Date().toISOString().split('T')[0],
        is_published: item.is_published !== undefined ? item.is_published : true,
        image_url: item.image_url || '',
        image_path: item.image_path || ''
      };

      await this.writeToSupabase('announcements', 'insert', newAnn.id, newAnn);

      const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(newAnn);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'addAnnouncement', item: newAnn });
      return newAnn;
    }

    async updateAnnouncement(id, updates) {
      await this.writeToSupabase('announcements', 'update', id, updates);

      const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      let list = raw ? JSON.parse(raw) : [];
      list = list.map((a) => (a.id === id ? { ...a, ...updates } : a));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'updateAnnouncement', id, updates });
      return true;
    }

    async deleteAnnouncement(id) {
      const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      let list = raw ? JSON.parse(raw) : [];
      const announcement = list.find((item) => item.id === id);
      const synced = await this.writeToSupabase('announcements', 'delete', id);
      list = list.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'deleteAnnouncement', id });

      if (synced && announcement?.image_path) {
        const { error } = await this.supabase.storage
          .from('announcement-photos')
          .remove([announcement.image_path]);
        if (error) {
          console.error('Announcement was deleted but its photo cleanup failed:', error);
          throw new Error('Announcement deleted, but its uploaded photo could not be removed.');
        }
      }
      return true;
    }

    async uploadAnnouncementPhoto(file) {
      if (!(await this.requireSupabaseWriteAccess())) {
        throw new Error('Connect to Supabase before uploading an announcement photo.');
      }
      if (!file || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        throw new Error('Choose a JPG, PNG, WebP, or GIF image.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Announcement photos must be 5 MB or smaller.');
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${this.generateUuid()}-${safeFileName}`;
      const { data, error } = await this.supabase.storage
        .from('announcement-photos')
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false
        });
      if (error) {
        console.error('Supabase announcement photo upload failed:', error);
        throw error;
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from('announcement-photos')
        .getPublicUrl(data.path);
      return { image_url: publicUrl, image_path: data.path };
    }

    async removeAnnouncementPhoto(path) {
      if (!(await this.requireSupabaseWriteAccess())) return false;
      const { error } = await this.supabase.storage
        .from('announcement-photos')
        .remove([path]);
      if (error) {
        console.error('Supabase announcement photo removal failed:', error);
        throw error;
      }
      return true;
    }

    // -------------------------------------------------------------
    // TOURNAMENT SETTINGS
    // -------------------------------------------------------------
    async getSettings() {
      if (this.isSupabaseActive && this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('tournament_settings')
            .select('*')
            .limit(1)
            .maybeSingle();
          if (error) throw error;
          const config = window.MVJ_CONFIG || {};
          const settings = data || {
            tournament_name: config.PORTAL_TITLE || 'MVJ Interdepartment Sports',
            academic_year: config.ACADEMIC_YEAR || '2026-2027',
            tournament_status: config.TOURNAMENT_STATUS || 'Ongoing',
            homepage_tagline: config.TAGLINE || 'ONE COLLEGE. MULTIPLE DEPARTMENTS. ONE CHAMPION.',
            homepage_subtitle: config.SUBTITLE || 'Celebrating sportsmanship, teamwork and interdepartmental excellence.',
            logo_path: config.LOGO_PATH || 'assets/images/mvj-logo.png'
          };
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
          return settings;
        } catch (e) {
          console.warn('Supabase getSettings error:', e);
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const config = window.MVJ_CONFIG || {};
      return raw ? JSON.parse(raw) : {
        tournament_name: config.PORTAL_TITLE || 'MVJ Interdepartment Sports',
        academic_year: config.ACADEMIC_YEAR || '2026-2027',
        tournament_status: config.TOURNAMENT_STATUS || 'Ongoing',
        homepage_tagline: config.TAGLINE || 'ONE COLLEGE. MULTIPLE DEPARTMENTS. ONE CHAMPION.',
        homepage_subtitle: config.SUBTITLE || 'Celebrating sportsmanship, teamwork and interdepartmental excellence.',
        logo_path: config.LOGO_PATH || 'assets/images/mvj-logo.png'
      };
    }

    async updateSettings(settings) {
      const normalizedSettings = {
        ...settings,
        updated_at: new Date().toISOString()
      };

      if (await this.requireSupabaseWriteAccess()) {
        try {
          const { data: existing, error: selectError } = await this.supabase
            .from('tournament_settings')
            .select('id')
            .limit(1)
            .maybeSingle();
          if (selectError) throw selectError;

          if (existing?.id) {
            const { error } = await this.supabase.from('tournament_settings').update(normalizedSettings).eq('id', existing.id);
            if (error) throw error;
          } else {
            const { error } = await this.supabase.from('tournament_settings').insert([{ ...normalizedSettings, id: this.generateUuid() }]);
            if (error) throw error;
          }
        } catch (e) {
          console.error('Supabase updateSettings failed:', e);
          throw e;
        }
      }

      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      this.notifyListeners({ action: 'updateSettings', settings });
      return true;
    }

    // -------------------------------------------------------------
    // OVERALL STATISTICS
    // -------------------------------------------------------------
    async getStats() {
      const [departments, sports, matches] = await Promise.all([
        this.getDepartments(),
        this.getSports(),
        this.getMatches()
      ]);

      const completed = matches.filter((m) => m.status === 'Completed').length;
      const upcoming = matches.filter((m) => m.status === 'Upcoming').length;
      const live = matches.filter((m) => m.status === 'Live').length;

      return {
        totalDepartments: departments.length,
        totalSports: sports.length,
        totalMatches: matches.length,
        completedMatches: completed,
        upcomingMatches: upcoming,
        liveMatches: live
      };
    }

    // Color generator for new departments
    getRandomColor() {
      const palette = [
        '#174EA6', '#2878D0', '#0D9488', '#7C3AED', 
        '#EA580C', '#D97706', '#475569', '#DB2777', 
        '#059669', '#4F46E5', '#9333EA', '#0284C7'
      ];
      return palette[Math.floor(Math.random() * palette.length)];
    }
  }

  // Expose singleton instance globally
  window.MVJ_DB = new SportsDatabase();
})();
