
/**
 * MVJ INTERDEPARTMENT SPORTS
 * Secure Supabase Authentication
 */

(function () {
    'use strict';

    class AuthManager {

        constructor() {
            this.currentUser = null;
        }

        // 1. Get Supabase connection
        getClient() {

            const db = window.MVJ_DB;

            if (!db || !db.isSupabaseActive || !db.supabase) {
                throw new Error('Supabase is not connected.');
            }

            return db.supabase;
        }

        // 2. Verify the current user and admin role
        async getAdminSession() {

            const db = window.MVJ_DB;
            if (!db || !db.isSupabaseActive || !db.supabase) {
                this.currentUser = null;
                return null;
            }

            const supabase = db.supabase;

            // Ask Supabase to verify the current user
            const { data, error } =
                await supabase.auth.getUser();

            if (error || !data.user) {
                this.currentUser = null;
                return null;
            }

            const user = data.user;

            // Check the admin_profiles table
            const { data: profile, error: profileError } =
                await supabase
                    .from('admin_profiles')
                    .select('user_id, email, full_name, role')
                    .eq('user_id', user.id)
                    .eq('role', 'admin')
                    .maybeSingle();

            if (profileError || !profile) {

                await supabase.auth.signOut();

                this.currentUser = null;

                return null;
            }

            this.currentUser = {
                id: user.id,
                email: user.email,
                name: profile.full_name,
                role: profile.role
            };

            return this.currentUser;
        }

        // 3. Admin login
        async login(email, password) {

            const supabase = this.getClient();

            try {

                // Authenticate with Supabase
                const { data, error } =
                    await supabase.auth.signInWithPassword({
                        email: String(email || '').trim(),
                        password: String(password || '')
                    });

                if (error) {
                    return {
                        success: false,
                        message: 'Invalid email or password.'
                    };
                }

                // Verify administrator permissions
                const admin = await this.getAdminSession();

                if (!admin) {
                    return {
                        success: false,
                        message: 'This account is not authorized as an administrator.'
                    };
                }

                return {
                    success: true,
                    user: admin
                };

            } catch (error) {

                console.error('Authentication error:', error);

                return {
                    success: false,
                    message: 'Authentication service unavailable.'
                };
            }
        }

        // 4. Check login status
        async isAuthenticated() {

            try {
                const admin = await this.getAdminSession();
                return Boolean(admin);
            } catch (error) {
                console.error(error);
                return false;
            }
        }

        // 5. Protect admin pages
        async requireAuth() {

            const admin = await this.getAdminSession();

            if (!admin) {

                const isInAdmin =
                    window.location.pathname.includes('/admin/');

                window.location.href =
                    isInAdmin ? 'login.html' : 'admin/login.html';

                return false;
            }

            return true;
        }

        // 6. Redirect an already logged-in admin
        async redirectIfAuthenticated() {

            const admin = await this.getAdminSession();

            if (admin) {

                const isInAdmin =
                    window.location.pathname.includes('/admin/');

                window.location.href =
                    isInAdmin ? 'dashboard.html' : 'admin/dashboard.html';

                return true;
            }

            return false;
        }

        // 7. Logout
        async logout() {

            const supabase = this.getClient();

            try {

                const { error } = await supabase.auth.signOut();

                if (error) {
                    throw error;
                }

            } catch (error) {

                console.error('Logout error:', error);
            }

            this.currentUser = null;

            const isInAdmin =
                window.location.pathname.includes('/admin/');

            window.location.href =
                isInAdmin ? 'login.html' : 'admin/login.html';
        }
    }

    // Create one global authentication manager
    window.MVJ_AUTH = new AuthManager();

})();
