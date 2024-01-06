import { Database } from "@/supabase/types";

export type userRoles = Database["public"]["Enums"]["user_role"];

// for storing data into localStorage
export const setLocalStorageData = (localStorageKey: string, data: any) => {
    return localStorage.setItem(localStorageKey, data)
}

// for getting  data from the localStorage
export const getLocalStorageData = (localStorageKey: string) => {
    return localStorage.getItem(localStorageKey)
}

// check role of user is admin or Owner
export const checkIsAdminOrOwner = (role: string) => {
    return role === 'admin' || role === 'owner';
};

// User roles
export const roles: userRoles[] = ["owner", "admin", "editor", "viewer"];
export const invitationRoles: userRoles[] = ["admin", "editor", "viewer"];