// Webhook Configuration (replaces Supabase)
// VERSION: 2025-02-02 - WEBHOOK VERSION - NO SUPABASE
console.log('🚀🚀🚀 LOADING WEBHOOK VERSION - ' + new Date().toISOString());
console.log('🚀 THIS FILE DOES NOT USE SUPABASE - ONLY WEBHOOKS 🚀');

// Prevent any Supabase initialization
if (typeof window !== 'undefined') {
    window.supabaseClient = null;
    window.SUPABASE_URL = null;
    window.SUPABASE_ANON_KEY = null;
}

const WEBHOOK_URL = 'https://jackwilde.app.n8n.cloud/webhook/23111c41-9b7b-47f6-af66-f8cb13f442e0';

// Helper function to call the webhook - make it globally accessible
async function callWebhook(action, data = {}) {
    try {
        console.log(`📡 Calling webhook with action: ${action}`, data);
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                ...data
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Webhook error for action ${action}:`, errorText);
            throw new Error(`Webhook request failed: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log(`✅ Webhook response for ${action}:`, result);
        return result;
    } catch (error) {
        console.error(`❌ Error calling webhook for action ${action}:`, error);
        throw error;
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

// Database Functions (using webhook instead of Supabase)
const SupabaseDB = {
    // Auth operations
    async signUp(email, password, metadata = {}) {
        try {
            const result = await callWebhook('signUp', { email, password, metadata });
            return { data: result.data, error: result.error || null };
        } catch (error) {
            return { error: error.message || 'Sign up failed' };
        }
    },

    async signIn(email, password) {
        try {
            const result = await callWebhook('signIn', { email, password });
            return { data: result.data, error: result.error || null };
        } catch (error) {
            return { error: error.message || 'Sign in failed' };
        }
    },

    async signOut() {
        try {
            const result = await callWebhook('signOut', {});
            return { error: result.error || null };
        } catch (error) {
            return { error: error.message || 'Sign out failed' };
        }
    },

    async getCurrentUser() {
        try {
            const result = await callWebhook('getCurrentUser', {});
            return result.user || null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    },

    // Profiles table operations (replaces users)
    async getUsers() {
        try {
            const result = await callWebhook('getUsers', {});
            
            if (result.error) {
                console.warn('Webhook error, falling back to localStorage');
                const localUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
                console.log('📦 Falling back to localStorage users:', localUsers.length);
                return localUsers;
            }
            
            // Handle array response (webhook returns arrays directly)
            let users = [];
            if (Array.isArray(result)) {
                users = result;
            } else if (Array.isArray(result.data)) {
                users = result.data;
            } else if (Array.isArray(result.users)) {
                users = result.users;
            }
            
            // Normalize the response
            return users.map(profile => {
                const companyName = profile.company_id && result.companiesMap && result.companiesMap[profile.company_id] 
                    ? result.companiesMap[profile.company_id] 
                    : null;
                return normalizeProfileToUser(profile, companyName);
            });
        } catch (error) {
            console.error('Error fetching users from webhook:', error);
            // Fallback to localStorage
            const localUsers = JSON.parse(localStorage.getItem('masterUsers') || '[]');
            console.log('📦 Falling back to localStorage users:', localUsers.length);
            return localUsers;
        }
    },

    async createUser(userData) {
        console.log('🔵 createUser called with:', { ...userData, password: '***' });
        
        try {
            const result = await callWebhook('createUser', { userData });
            
            if (result.error) {
                console.error('Webhook error creating user:', result.error);
                // Fallback to localStorage
                return this._createUserLocalStorage(userData);
            }
            
            // Handle array response (webhook returns arrays)
            if (Array.isArray(result) && result.length > 0) {
                return result[0];
            } else if (Array.isArray(result.data) && result.data.length > 0) {
                return result.data[0];
            } else if (result.data && !Array.isArray(result.data)) {
                return result.data;
            } else if (result.user) {
                return result.user;
            }
            
            return null;
        } catch (error) {
            console.error('Error creating user via webhook:', error);
            // Fallback to localStorage
            return this._createUserLocalStorage(userData);
        }
    },

    _createUserLocalStorage(userData) {
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
    },

    async updateUser(userId, updates) {
        try {
            const result = await callWebhook('updateUser', { userId, updates });
            
            if (result.error) {
                console.error('Webhook error updating user:', result.error);
                return null;
            }
            
            return result.data || result.user || null;
        } catch (error) {
            console.error('Error updating user via webhook:', error);
            return null;
        }
    },

    async deleteUser(userId) {
        try {
            const result = await callWebhook('deleteUser', { userId });
            
            if (result.error) {
                console.error('Webhook error deleting user:', result.error);
                return false;
            }
            
            return result.success !== false;
        } catch (error) {
            console.error('Error deleting user via webhook:', error);
            return false;
        }
    },

    // Companies table operations
    async getCompanies() {
        try {
            const result = await callWebhook('getCompanies', {});
            
            if (result.error) {
                console.warn('Webhook error, falling back to localStorage');
                return JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            }
            
            // Handle array response (webhook returns arrays directly)
            if (Array.isArray(result)) {
                return result;
            } else if (Array.isArray(result.data)) {
                return result.data;
            } else if (Array.isArray(result.companies)) {
                return result.companies;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching companies from webhook:', error);
            // Fallback to localStorage
            return JSON.parse(localStorage.getItem('masterCompanies') || '[]');
        }
    },

    async createCompany(company) {
        try {
            const result = await callWebhook('createCompany', { company });
            
            if (result.error) {
                console.error('Webhook error creating company:', result.error);
                // Fallback to localStorage
                return this._createCompanyLocalStorage(company);
            }
            
            // Handle array response (webhook returns arrays)
            if (Array.isArray(result) && result.length > 0) {
                return result[0];
            } else if (Array.isArray(result.data) && result.data.length > 0) {
                return result.data[0];
            } else if (result.data && !Array.isArray(result.data)) {
                return result.data;
            } else if (result.company) {
                return result.company;
            }
            
            return null;
        } catch (error) {
            console.error('Error creating company via webhook:', error);
            // Fallback to localStorage
            return this._createCompanyLocalStorage(company);
        }
    },

    _createCompanyLocalStorage(company) {
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
    },

    async findCompanyByName(name) {
        try {
            const result = await callWebhook('findCompanyByName', { name });
            
            if (result.error) {
                console.warn('Webhook error, falling back to localStorage');
                const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
                return companies.find(c => c.name === name) || null;
            }
            
            // Handle array response (webhook returns arrays)
            if (Array.isArray(result) && result.length > 0) {
                return result[0];
            } else if (Array.isArray(result.data) && result.data.length > 0) {
                return result.data[0];
            } else if (result.data && !Array.isArray(result.data)) {
                return result.data;
            } else if (result.company) {
                return result.company;
            }
            
            return null;
        } catch (error) {
            console.error('Error finding company via webhook:', error);
            // Fallback to localStorage
            const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            return companies.find(c => c.name === name) || null;
        }
    },

    async updateCompany(companyId, updates) {
        try {
            const result = await callWebhook('updateCompany', { companyId, updates });
            
            if (result.error) {
                console.error('Webhook error updating company:', result.error);
                return null;
            }
            
            return result.data || result.company || null;
        } catch (error) {
            console.error('Error updating company via webhook:', error);
            return null;
        }
    },

    async deleteCompany(companyId) {
        try {
            // Get the company before deleting
            const companies = JSON.parse(localStorage.getItem('masterCompanies') || '[]');
            const deletedCompany = companies.find(c => c.id === companyId);
            
            const result = await callWebhook('deleteCompany', { companyId });
            
            if (result.error) {
                console.error('Webhook error deleting company:', result.error);
                // Send to user creation webhook even if main webhook fails
                if (deletedCompany) {
                    this._sendCompanyDeletionToWebhook(deletedCompany);
                }
                return false;
            }
            
            // Send to user creation webhook
            if (deletedCompany) {
                this._sendCompanyDeletionToWebhook(deletedCompany);
            }
            
            return result.success !== false;
        } catch (error) {
            console.error('Error deleting company via webhook:', error);
            return false;
        }
    },
    
    _sendCompanyDeletionToWebhook(company) {
        // Send company deletion to webhook
        fetch('https://jackwilde.app.n8n.cloud/webhook/561e4d2b-3047-456b-acf0-fb22e460ed4a', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'companydeleted',
                ...company,
                deleted_at: new Date().toISOString()
            })
        }).then(() => {
            console.log('Company deletion sent to user creation webhook successfully');
        }).catch(error => {
            console.error('Error sending company deletion to webhook:', error);
            // Don't block - continue anyway
        });
    },

    // Access codes table operations
    async getAccessCodes() {
        try {
            const result = await callWebhook('getAccessCodes', {});
            
            if (result.error) {
                console.warn('Webhook error, falling back to localStorage');
                const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
                return codes.map(code => ({
                    ...code,
                    created_date: code.createdDate || code.created_date,
                    expiry_date: code.expiryDate || code.expiry_date,
                    max_companies: code.maxCompanies || code.max_companies,
                    used_by: code.usedBy || code.used_by || []
                }));
            }
            
            // Handle array response (webhook returns arrays directly)
            if (Array.isArray(result)) {
                return result;
            } else if (Array.isArray(result.data)) {
                return result.data;
            } else if (Array.isArray(result.accessCodes)) {
                return result.accessCodes;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching access codes from webhook:', error);
            // Fallback to localStorage
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            return codes.map(code => ({
                ...code,
                created_date: code.createdDate || code.created_date,
                expiry_date: code.expiryDate || code.expiry_date,
                max_companies: code.maxCompanies || code.max_companies,
                used_by: code.usedBy || code.used_by || []
            }));
        }
    },

    async createAccessCode(accessCode) {
        try {
            const result = await callWebhook('createAccessCode', { accessCode });
            
            if (result.error) {
                console.error('Webhook error creating access code:', result.error);
                // Fallback to localStorage
                const createdCode = this._createAccessCodeLocalStorage(accessCode);
                // Send to user creation webhook
                this._sendAccessCodeToWebhook(createdCode);
                return createdCode;
            }
            
            const createdCode = result.data || result.accessCode || null;
            // Send to user creation webhook
            if (createdCode) {
                this._sendAccessCodeToWebhook(createdCode);
            }
            return createdCode;
        } catch (error) {
            console.error('Error creating access code via webhook:', error);
            // Fallback to localStorage
            const createdCode = this._createAccessCodeLocalStorage(accessCode);
            // Send to user creation webhook
            this._sendAccessCodeToWebhook(createdCode);
            return createdCode;
        }
    },
    
    _sendAccessCodeToWebhook(accessCode) {
        // Send access code creation to webhook
        fetch('https://jackwilde.app.n8n.cloud/webhook/561e4d2b-3047-456b-acf0-fb22e460ed4a', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'accesscode',
                ...accessCode
            })
        }).then(() => {
            console.log('Access code sent to user creation webhook successfully');
        }).catch(error => {
            console.error('Error sending access code to webhook:', error);
            // Don't block - continue anyway
        });
    },

    _createAccessCodeLocalStorage(accessCode) {
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
    },

    async updateAccessCode(codeId, updates) {
        try {
            const result = await callWebhook('updateAccessCode', { codeId, updates });
            
            if (result.error) {
                console.error('Webhook error updating access code:', result.error);
                return null;
            }
            
            return result.data || result.accessCode || null;
        } catch (error) {
            console.error('Error updating access code via webhook:', error);
            return null;
        }
    },

    async deleteAccessCode(codeId) {
        try {
            // Get the code before deleting
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            const deletedCode = codes.find(c => c.id === codeId);
            
            const result = await callWebhook('deleteAccessCode', { codeId });
            
            if (result.error) {
                console.error('Webhook error deleting access code:', result.error);
                // Fallback to localStorage
                const filtered = codes.filter(c => c.id !== codeId);
                localStorage.setItem('masterAccessCodes', JSON.stringify(filtered));
                // Send to user creation webhook
                if (deletedCode) {
                    this._sendAccessCodeDeletionToWebhook(deletedCode);
                }
                return true;
            }
            
            // Send to user creation webhook
            if (deletedCode) {
                this._sendAccessCodeDeletionToWebhook(deletedCode);
            }
            
            return result.success !== false;
        } catch (error) {
            console.error('Error deleting access code via webhook:', error);
            // Fallback to localStorage
            const codes = JSON.parse(localStorage.getItem('masterAccessCodes') || '[]');
            const deletedCode = codes.find(c => c.id === codeId);
            const filtered = codes.filter(c => c.id !== codeId);
            localStorage.setItem('masterAccessCodes', JSON.stringify(filtered));
            // Send to user creation webhook
            if (deletedCode) {
                this._sendAccessCodeDeletionToWebhook(deletedCode);
            }
            return true;
        }
    },
    
    _sendAccessCodeDeletionToWebhook(accessCode) {
        // Send access code deletion to webhook
        fetch('https://jackwilde.app.n8n.cloud/webhook/561e4d2b-3047-456b-acf0-fb22e460ed4a', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'accesscodedeleted',
                ...accessCode,
                deleted_at: new Date().toISOString()
            })
        }).then(() => {
            console.log('Access code deletion sent to user creation webhook successfully');
        }).catch(error => {
            console.error('Error sending access code deletion to webhook:', error);
            // Don't block - continue anyway
        });
    },

    getClient() {
        // Return null since we're not using Supabase client anymore
        return null;
    },

    async findAccessCodeByCode(code) {
        // Normalize the search code
        const searchCode = String(code || '').trim().toUpperCase();
        
        try {
            const result = await callWebhook('findAccessCodeByCode', { code: searchCode });
            
            if (result.error) {
                console.log('Webhook: code not found, checking localStorage');
                // Fallback to localStorage
                return this._findAccessCodeLocalStorage(code, searchCode);
            }
            
            // Handle array response (webhook returns arrays)
            if (Array.isArray(result) && result.length > 0) {
                return result[0];
            } else if (Array.isArray(result.data) && result.data.length > 0) {
                return result.data[0];
            } else if (result.data && !Array.isArray(result.data)) {
                return result.data;
            } else if (result.accessCode) {
                return result.accessCode;
            }
            
            // If no data found, check localStorage
            console.log('Webhook: code not found in response, checking localStorage');
            return this._findAccessCodeLocalStorage(code, searchCode);
        } catch (error) {
            console.error('Error finding access code via webhook:', error);
            // Fallback to localStorage
            return this._findAccessCodeLocalStorage(code, searchCode);
        }
    },

    _findAccessCodeLocalStorage(code, searchCode) {
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
};

// sendToWebhook function - wrapper for callWebhook that matches the expected API
async function sendToWebhook(data, type) {
    try {
        console.log(`📡 sendToWebhook called with type: ${type}`, data);
        
        // Map type to action for callWebhook
        const action = type || 'data';
        
        // Call the webhook with the data and type
        const result = await callWebhook(action, {
            type: type,
            ...data
        });
        
        console.log(`✅ sendToWebhook success for type ${type}:`, result);
        return result;
    } catch (error) {
        console.error(`❌ Error in sendToWebhook for type ${type}:`, error);
        throw error;
    }
}

// Initialize message and expose callWebhook and sendToWebhook globally
if (typeof window !== 'undefined') {
    console.log('✅ Webhook-based database client initialized');
    window.supabaseClient = null; // Keep for compatibility but set to null
    window.callWebhook = callWebhook; // Make callWebhook accessible globally
    window.sendToWebhook = sendToWebhook; // Make sendToWebhook accessible globally
    console.log('✅ sendToWebhook function exposed globally');
}

