import { useState } from "react";
import { OrgMember } from "../components/layouts/navbar";
import { User, useSupabaseClient } from "@supabase/auth-helpers-react";
import { checkIsAdminOrOwner } from "../util";


const useCurrentUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentOrgUser, setCurrentOrgUser] = useState<OrgMember | null>(null);
    const [isAdminOrOwner, setIsAdminOrOwner] = useState<boolean>(false)
    const supabase = useSupabaseClient();

    const getCurrentOrgUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        setUser(data.user);
        const user_id = data.user?.id;
        const user_org_id = data.user?.user_metadata.org.id;
        if (user_id && user_org_id) {
            const org_Details = await supabase.from('org_member').select('*').eq('user_id', user_id).eq('org_id', user_org_id);
            if (org_Details) {
                const AdminOrOwnerResponse = checkIsAdminOrOwner((org_Details.data?.[0] as OrgMember).role);
                setIsAdminOrOwner(AdminOrOwnerResponse)
                setCurrentOrgUser(org_Details.data?.[0]);
            }
        }
    }

    const isOwnRole = (orgMemberRole: string) => {
        if (currentOrgUser?.role === orgMemberRole) {
            return true;
        } else if (currentOrgUser?.role === "admin" && orgMemberRole === "owner") {
            return true;
        } else {
            return false;
        }
    }

    return {
        user,
        currentOrgUser,
        isAdminOrOwner,
        getCurrentOrgUser,
        isOwnRole
    }
}

export default useCurrentUser;