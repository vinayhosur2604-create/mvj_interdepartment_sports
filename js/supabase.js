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
      const url = (config.SUPABASE_URL || localStorage.getItem('MVJ_SUPABASE_URL') || '').trim();
      const key = (config.SUPABASE_ANON_KEY || localStorage.getItem('MVJ_SUPABASE_ANON_KEY') || '').trim();
      return { url, key };
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
          .subscribe();
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
    if (!this.isSupabaseActive || !this.supabase) {
        throw new Error('Supabase is not connected.');
    }

    const { data, error } = await this.supabase
        .from('departments')
        .select('*')
        .order('points', { ascending: false });

    if (error) {
        console.error('Failed to fetch departments:', error);
        throw error;
    }

    return this.sortDepartments(data || []);
}

      const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      const list = raw ? JSON.parse(raw) : window.MVJ_CONFIG.DEPARTMENTS;
      return this.sortDepartments(list);
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

      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('departments').insert([newDept]);
        } catch (e) {
          console.warn('Supabase insert failed:', e);
        }
      }

      const list = await this.getDepartments();
      list.push(newDept);
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'addDepartment', item: newDept });
      return newDept;
    }

    async updateDepartment(id, updates) {
      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('departments').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase update failed:', e);
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
      let list = raw ? JSON.parse(raw) : [];
      list = list.map((d) => (d.id === id ? { ...d, ...updates } : d));
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'updateDepartment', id, updates });
      return true;
    }

    async deleteDepartment(id) {
      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('departments').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase delete failed:', e);
        }
      }

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
    if (!this.isSupabaseActive || !this.supabase) {
        throw new Error('Supabase is not connected.');
    }

    const { data, error } = await this.supabase
        .from('sports')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Failed to fetch sports:', error);
        throw error;
    }

    return data || [];
}


      const raw = localStorage.getItem(STORAGE_KEYS.SPORTS);
      return raw ? JSON.parse(raw) : window.MVJ_CONFIG.SPORTS;
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

      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('sports').insert([newSport]);
        } catch (e) {
          console.warn('Supabase addSport failed:', e);
        }
      }

      const list = await this.getSports();
      list.push(newSport);
      localStorage.setItem(STORAGE_KEYS.SPORTS, JSON.stringify(list));
      this.notifyListeners({ action: 'addSport', item: newSport });
      return newSport;
    }

    async updateSport(id, updates) {
      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('sports').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase updateSport failed:', e);
        }
      }

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

      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('sports').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase deleteSport failed:', e);
        }
      }

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
      if (this.isSupabaseActive && this.supabase) {
        try {
          let query = this.supabase.from('matches').select('*');
          if (filters.sport_id) query = query.eq('sport_id', filters.sport_id);
          if (filters.stage) query = query.eq('stage', filters.stage);
          if (filters.status) query = query.eq('status', filters.status);
          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            matches = data;
          }
        } catch (err) {
          console.warn('Supabase getMatches error, fallback local:', err);
        }
      }

      if (matches.length === 0) {
        const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
        matches = raw ? JSON.parse(raw) : window.MVJ_CONFIG.MATCHES;
      }

      // Apply client-side filters
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
        const sports = await this.getSports();
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

      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('matches').insert([newMatch]);
        } catch (e) {
          console.warn('Supabase addMatch failed:', e);
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
      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('matches').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase updateMatch failed:', e);
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
      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('matches').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase deleteMatch failed:', e);
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
          let q = this.supabase.from('announcements').select('*').order('created_at', { ascending: false });
          if (publishedOnly) q = q.eq('is_published', true);
          const { data, error } = await q;
          if (!error && data && data.length > 0) {
            return data;
          }
        } catch (e) {
          console.warn('Supabase getAnnouncements error:', e);
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
        is_published: item.is_published !== undefined ? item.is_published : true
      };

      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('announcements').insert([newAnn]);
        } catch (e) {
          console.warn('Supabase addAnnouncement failed:', e);
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(newAnn);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'addAnnouncement', item: newAnn });
      return newAnn;
    }

    async updateAnnouncement(id, updates) {
      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('announcements').update(updates).eq('id', id);
        } catch (e) {
          console.warn('Supabase updateAnnouncement failed:', e);
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      let list = raw ? JSON.parse(raw) : [];
      list = list.map((a) => (a.id === id ? { ...a, ...updates } : a));
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'updateAnnouncement', id, updates });
      return true;
    }

    async deleteAnnouncement(id) {
      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          await this.supabase.from('announcements').delete().eq('id', id);
        } catch (e) {
          console.warn('Supabase deleteAnnouncement failed:', e);
        }
      }

      const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      let list = raw ? JSON.parse(raw) : [];
      list = list.filter((a) => a.id !== id);
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(list));
      this.notifyListeners({ action: 'deleteAnnouncement', id });
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
          if (!error && data) return data;
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

      if (this.isSupabaseActive && this.supabase && (await this.canWriteToSupabase())) {
        try {
          const { data: existing } = await this.supabase
            .from('tournament_settings')
            .select('id')
            .limit(1)
            .maybeSingle();

          if (existing?.id) {
            await this.supabase.from('tournament_settings').update(normalizedSettings).eq('id', existing.id);
          } else {
            await this.supabase.from('tournament_settings').insert([{ ...normalizedSettings, id: this.generateUuid() }]);
          }
        } catch (e) {
          console.warn('Supabase updateSettings failed:', e);
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
