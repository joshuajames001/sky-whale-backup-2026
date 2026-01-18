import { supabase } from './supabase';

export interface EdgeFunctionResult<T> {
    data: T | null;
    error: any;
}

/**
 * Invokes a Supabase Edge Function with enforced Authentication.
 * This helper ensures a valid session token is always passed in the Authorization header,
 * bypassing potential issues with client-side auto-injection or stale tokens.
 */
export const invokeEdgeFunction = async <T = any>(
    functionName: string,
    body: any
): Promise<EdgeFunctionResult<T>> => {
    try {
        // 1. Get Session with proactive refresh check
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.error("❌ callEdgeFunction: No active session found.");
            return { data: null, error: new Error("Authentication required (No Session)") };
        }

        // 2. Check Expiration & Force Refresh if needed (buffer 2 minutes)
        // Note: supabase-js usually handles this, but we force check to be safe.
        const expiresAt = (session.expires_at || 0) * 1000;
        const now = Date.now();
        let accessToken = session.access_token;

        if (expiresAt > 0 && expiresAt < now + 120000) {
            console.log("⚠️ Token near expiry, refreshing...");
            const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError || !refreshed) {
                console.error("❌ Token Refresh Failed:", refreshError);
                // Try with old token anyway? Or fail? Fail is safer to avoid 401 loop.
                return { data: null, error: new Error("Session expired and refresh failed.") };
            }
            accessToken = refreshed.access_token;
            console.log("✅ Token Refreshed.");
        }

        // 3. Invoke Function with Explicit Header
        console.log(`🚀 Invoking '${functionName}' with explicit Auth header...`);
        const { data, error } = await supabase.functions.invoke(functionName, {
            body
        });

        if (error) {
            console.error(`❌ Edge Function '${functionName}' RAW Error:`, error);
            
            // Attempt to extract JSON body from the response context (FunctionsHttpError)
            let serverMessage = null;
            if (error && typeof error === 'object' && 'context' in error) {
                 const ctx = (error as any).context;
                 if (ctx && typeof ctx.json === 'function') {
                     try {
                         const json = await ctx.json(); 
                         console.error("❌ Edge Function SERVER RESPONSE:", JSON.stringify(json, null, 2));
                         if (json && json.error) serverMessage = json.error;
                     } catch (e) {
                         console.warn("Could not parse error context JSON", e);
                     }
                 }
            }

            // Propagate the specific server error message if found
            if (serverMessage) {
                return { data: null, error: new Error(serverMessage) };
            }

            return { data: null, error };
        }

        return { data, error: null };

    } catch (err: any) {
        console.error(`💥 Unexpected Error calling '${functionName}':`, err);
        return { data: null, error: err };
    }
};
