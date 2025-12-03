// Supabase Configuration
const SUPABASE_URL = 'https://hneyncvndwejbvkxndpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuZXluY3ZuZHdlamJ2a3huZHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzYwNjIsImV4cCI6MjA3OTQxMjA2Mn0.uN9VzRZ-HNNci5nwbVnNUCnmBDaF3F4vsmVjsKQHerc';

// Initialize Supabase client
let supabaseClient = null;

// Make supabaseClient accessible globally
if (typeof window !== 'undefined') {
    window.supabaseClient = null;
}

function logSupabaseError(context, error) {
    if (!error) return;
    
    const details = {
        message: error.message || 'No message provided',
        code: error.code || 'N/A',
        hint: error.hint || 'N/A',
        details: error.details || 'N/A'
    };
    
    if (console.groupCollapsed) {
        console.groupCollapsed(`Supabase error while ${context}`);
        console.error('Message:', details.message);
        console.error('Code:', details.code);
        console.error('Hint:', details.hint);
        console.error('Details:', details.details);
        console.groupEnd();
    } else {
        console.error(`Supabase error while ${context}:`, details);
    }
    
    console.warn('Falling back to local data. Verify Supabase tables, RLS policies, or API availability.');
}

function initSupabase() {
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('⚠️ Supabase not configured. Using localStorage fallback.');
        return null;
    }
    
    if (typeof supabase !== 'undefined') {
        try {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            // Make accessible globally
            if (typeof window !== 'undefined') {
                window.supabaseClient = supabaseClient;
            }
            console.log('✅ Supabase client initialized');
            return supabaseClient;
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
            return null;
        }
    } else {
        console.warn('⚠️ Supabase JS library not loaded. Using localStorage fallback.');
        return null;
    }
}

// Initialize on load
if (typeof window !== 'undefined') {
    if (typeof supabase === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
            initSupabase();
        };
        document.head.appendChild(script);
    } else {
        initSupabase();
    }
}

// Helper function to normalize user data (profiles -> legacy format for compatibility)
function normalizeProfileToUser(profile, companyName = null) {
    return {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        full_name: profile.full_name || profile.fullName || '',
        company: companyName || profile.company || '',
        company_id: profile.company_id,
        role: profile.role || 'user',
        organizations: profile.organizations || [],
        created: profile.created_at || profile.created,
        created_at: profile.created_at,
        lastLogin: profile.last_login_at || profile.lastLogin,
        status: 'active'
    };
}

// Helper function to convert legacy user format to profile format
function convertUserToProfile(user, companyId = null) {
    return {
        username: user.username,
        email: user.email,
        full_name: user.full_name || user.fullName || user.username,
        company_id: companyId || user.company_id,
        role: user.role || 'user',
        organizations: Array.isArray(user.organizations) ? user.organizations : (user.organizations ? [user.organizations] : [])
    };
}

// Supabase Database Functions
const SupabaseDB = {
    // Auth operations
    async signUp(email, password, metadata = {}) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return { error: 'Supabase not initialized' };
        }
        
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        
        return { data, error };
    },

    async signIn(email, password) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return { error: 'Supabase not initialized' };
        }
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });
        
        return { data, error };
    },

    async signOut() {
        if (!supabaseClient) return { error: 'Supabase not initialized' };
        return await supabaseClient.auth.signOut();
    },

    async getCurrentUser() {
        if (!supabaseClient) return null;
        const { data: { user } } = await supabaseClient.auth.getUser();
        return user;
    },

    // Profiles table operations (replaces users)
    async getUsers() {
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for users');
            const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
            return users;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return [];
        }
        
        try {
            // First try to get profiles without join (simpler query)
            const { data: profilesData, error: profilesError } = await supabaseClient
                .from('profiles')
                .select('*');
            
            if (profilesError) {
                logSupabaseError('fetching profiles', profilesError);
                // Fallback to localStorage on error
                const localUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
                console.log('📦 Falling back to localStorage users:', localUsers.length);
                return localUsers;
            }
            
            // Get companies separately if we have profiles
            let companiesMap = {};
            if (profilesData && profilesData.length > 0) {
                try {
                    const { data: companiesData } = await supabaseClient
                        .from('companies')
                        .select('id, name');
                    
                    if (companiesData) {
                        companiesMap = companiesData.reduce((acc, company) => {
                            acc[company.id] = company.name;
                            return acc;
                        }, {});
                    }
                } catch (companiesErr) {
                    console.warn('Could not fetch companies for user mapping:', companiesErr);
                }
            }
            
            // Normalize profiles to user format for compatibility
            return (profilesData || []).map(profile => {
                const companyName = profile.company_id && companiesMap[profile.company_id] 
                    ? companiesMap[profile.company_id] 
                    : null;
                return normalizeProfileToUser(profile, companyName);
            });
        } catch (err) {
            logSupabaseError('fetching profiles (exception)', err);
            const localUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
            return localUsers;
        }
    },

    async createUser(userData) {
        console.log('🔵 createUser called with:', { ...userData, password: '***' });
        
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for user creation');
            try {
                const users = JSON.parse(localStorage.getItem('masterUsers') || '[]');
                const newUser = {
                    id: `user-${Date.now()}`,
                    ...userData,
                    created_at: userData.created || userData.created_at || new Date().toISOString(),
                    last_login_at: null,
                    fullName: userData.full_name || userData.fullName || '',
                    status: userData.status || 'active'
                };
                users.push(newUser);
                localStorage.setItem('masterUsers', JSON.stringify(users));
                console.log('✅ User created in localStorage:', newUser);
                return newUser;
            } catch (error) {
                console.error('❌ Error in localStorage fallback:', error);
                return null;
            }
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        
        // If user has password, create via Auth first, then profile
        if (userData.password && userData.email) {
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        username: userData.username,
                        full_name: userData.full_name || userData.fullName || userData.username
                    }
                }
            });
            
            if (authError) {
                console.error('Error creating auth user:', authError);
                return null;
            }
            
            // Profile should be created automatically by trigger, but update it with additional data
            if (authData.user) {
                const profileData = convertUserToProfile(userData, userData.company_id);
                const { data: profile, error: profileError } = await supabaseClient
                    .from('profiles')
                    .update(profileData)
                    .eq('id', authData.user.id)
                    .select()
                    .single();
                
                if (profileError) {
                    console.error('Error updating profile:', profileError);
                    // Still return the auth user
                    return normalizeProfileToUser({ ...authData.user, ...profileData });
                }
                
                return normalizeProfileToUser(profile, userData.company);
            }
        } else {
            // Direct profile creation (for admin-created users without auth)
            const profileData = convertUserToProfile(userData, userData.company_id);
            const { data, error } = await supabaseClient
                .from('profiles')
                .insert([profileData])
                .select()
                .single();
            
            if (error) {
                console.error('Error creating profile:', error);
                return null;
            }
            
            return normalizeProfileToUser(data, userData.company);
        }
        
        return null;
    },

    async updateUser(userId, updates) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        
        // Convert updates to profile format
        const profileUpdates = {};
        if (updates.username) profileUpdates.username = updates.username;
        if (updates.email) profileUpdates.email = updates.email;
        if (updates.full_name || updates.fullName) profileUpdates.full_name = updates.full_name || updates.fullName;
        if (updates.company_id) profileUpdates.company_id = updates.company_id;
        if (updates.role) profileUpdates.role = updates.role;
        if (updates.organizations) profileUpdates.organizations = Array.isArray(updates.organizations) ? updates.organizations : [updates.organizations];
        
        const { data, error } = await supabaseClient
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating profile:', error);
            return null;
        }
        return normalizeProfileToUser(data);
    },

    async deleteUser(userId) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return false;
        }
        
        // Delete profile (auth user will be deleted via cascade)
        const { error } = await supabaseClient
            .from('profiles')
            .delete()
            .eq('id', userId);
        
        if (error) {
            console.error('Error deleting profile:', error);
            return false;
        }
        return true;
    },

    // Companies table operations
    async getCompanies() {
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for companies');
            return JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) {
                return JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            }
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('companies')
                .select('*');
            
            if (error) {
                logSupabaseError('fetching companies', error);
                // Fallback to localStorage on error
                return JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            }
            return data || [];
        } catch (err) {
            logSupabaseError('fetching companies (exception)', err);
            return JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        }
    },

    async createCompany(company) {
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for company creation');
            const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            const newCompany = {
                id: `company-${Date.now()}`,
                ...company,
                created_at: company.created_at || new Date().toISOString(),
                status: 'active',
                users: 0,
                policies: 0
            };
            companies.push(newCompany);
            localStorage.setItem('masterCompanies', JSON.stringify(companies));
            return newCompany;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) {
                // Fallback to localStorage
                const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
                const newCompany = {
                    id: `company-${Date.now()}`,
                    ...company,
                    created_at: company.created_at || new Date().toISOString(),
                    status: 'active',
                    users: 0,
                    policies: 0
                };
                companies.push(newCompany);
                localStorage.setItem('masterCompanies', JSON.stringify(companies));
                return newCompany;
            }
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('companies')
                .insert([company])
                .select()
                .single();
            
            if (error) {
                console.error('Error creating company:', error);
                // Fallback to localStorage on error
                console.log('📦 Falling back to localStorage for company creation');
                const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
                const newCompany = {
                    id: `company-${Date.now()}`,
                    ...company,
                    created_at: company.created_at || new Date().toISOString(),
                    status: 'active',
                    users: 0,
                    policies: 0
                };
                companies.push(newCompany);
                localStorage.setItem('masterCompanies', JSON.stringify(companies));
                return newCompany;
            }
            return data;
        } catch (err) {
            console.error('Exception creating company:', err);
            // Fallback to localStorage
            const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            const newCompany = {
                id: `company-${Date.now()}`,
                ...company,
                created_at: company.created_at || new Date().toISOString(),
                status: 'active',
                users: 0,
                policies: 0
            };
            companies.push(newCompany);
            localStorage.setItem('masterCompanies', JSON.stringify(companies));
            return newCompany;
        }
    },

    async findCompanyByName(name) {
        // Fallback to localStorage if Supabase not configured
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for finding company');
            const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            return companies.find(c => c.name === name) || null;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) {
                // Fallback to localStorage
                const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
                return companies.find(c => c.name === name) || null;
            }
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('companies')
                .select('*')
                .eq('name', name)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    // Not found - check localStorage as fallback
                    const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
                    return companies.find(c => c.name === name) || null;
                }
                console.error('Error finding company:', error);
                // Fallback to localStorage on error
                console.log('📦 Falling back to localStorage for finding company');
                const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
                return companies.find(c => c.name === name) || null;
            }
            return data;
        } catch (err) {
            console.error('Exception finding company:', err);
            // Fallback to localStorage
            const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            return companies.find(c => c.name === name) || null;
        }
    },

    async updateCompany(companyId, updates) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        
        const { data, error } = await supabaseClient
            .from('companies')
            .update(updates)
            .eq('id', companyId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating company:', error);
            return null;
        }
        return data;
    },

    async deleteCompany(companyId) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return false;
        }
        
        const { error } = await supabaseClient
            .from('companies')
            .delete()
            .eq('id', companyId);
        
        if (error) {
            console.error('Error deleting company:', error);
            return false;
        }
        return true;
    },

    // Access codes table operations
    async getAccessCodes() {
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for access codes');
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            return codes.map(code => ({
                ...code,
                created_date: code.createdDate || code.created_date,
                expiry_date: code.expiryDate || code.expiry_date,
                max_companies: code.maxCompanies || code.max_companies,
                used_by: code.usedBy || code.used_by || []
            }));
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return [];
        }
        
        const { data, error } = await supabaseClient
            .from('access_codes')
            .select('*');
        
        if (error) {
            console.error('Error fetching access codes:', error);
            // Fallback to localStorage
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            return codes;
        }
        return data || [];
    },

    async createAccessCode(accessCode) {
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for access code creation');
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            const newCode = {
                id: `code-${Date.now()}`,
                ...accessCode,
                createdDate: accessCode.created_date || accessCode.createdDate,
                expiryDate: accessCode.expiry_date || accessCode.expiryDate,
                maxCompanies: accessCode.max_companies || accessCode.maxCompanies,
                usedBy: accessCode.used_by || accessCode.usedBy || []
            };
            codes.push(newCode);
            localStorage.setItem('masterAccessCodes', JSON.stringify(codes));
            return newCode;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        
        const { data, error } = await supabaseClient
            .from('access_codes')
            .insert([accessCode])
            .select()
            .single();
        
        if (error) {
            console.error('Error creating access code:', error);
            return null;
        }
        return data;
    },

    async updateAccessCode(codeId, updates) {
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        
        const { data, error } = await supabaseClient
            .from('access_codes')
            .update(updates)
            .eq('id', codeId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating access code:', error);
            return null;
        }
        return data;
    },

    async deleteAccessCode(codeId) {
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for access code deletion');
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            const filtered = codes.filter(c => c.id !== codeId);
            localStorage.setItem('masterAccessCodes', JSON.stringify(filtered));
            return true;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return false;
        }
        
        const { error } = await supabaseClient
            .from('access_codes')
            .delete()
            .eq('id', codeId);
        
        if (error) {
            console.error('Error deleting access code:', error);
            return false;
        }
        return true;
    },

    getClient() {
        return supabaseClient;
    },

    async findAccessCodeByCode(code) {
        // Normalize the search code
        const searchCode = String(code || '').trim().toUpperCase();
        
        if (!supabaseClient || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.log('📦 Using localStorage fallback for access code lookup');
            console.log('🔍 Searching for code:', searchCode);
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            console.log('📋 Total codes in localStorage:', codes.length);
            console.log('📋 Codes:', codes.map(c => ({ code: c.code, status: c.status })));
            
            // Try exact match first (case-sensitive)
            let found = codes.find(c => {
                const codeValue = String(c.code || '').trim();
                return codeValue === code || codeValue === searchCode;
            });
            
            // If not found, try case-insensitive match
            if (!found) {
                found = codes.find(c => {
                    const codeValue = String(c.code || '').trim().toUpperCase();
                    return codeValue === searchCode;
                });
            }
            
            // Check if found and is active
            if (found) {
                const isActive = found.status === 'active' || !found.status;
                console.log('✅ Found code:', found.code, 'Status:', found.status, 'Active:', isActive);
                
                if (isActive) {
                    return {
                        ...found,
                        created_date: found.createdDate || found.created_date,
                        expiry_date: found.expiryDate || found.expiry_date,
                        max_companies: found.maxCompanies || found.max_companies,
                        used_by: found.usedBy || found.used_by || []
                    };
                } else {
                    console.log('❌ Code found but not active');
                }
            } else {
                console.log('❌ Code not found in localStorage');
            }
            return null;
        }
        
        if (!supabaseClient) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (!supabaseClient) return null;
        }
        
        const { data, error } = await supabaseClient
            .from('access_codes')
            .select('*')
            .eq('code', code)
            .eq('status', 'active')
            .single();
        
        if (error) {
            if (error.code === 'PGRST116') {
                return null;
            }
            console.error('Error finding access code:', error);
            return null;
        }
        return data;
    }
};
