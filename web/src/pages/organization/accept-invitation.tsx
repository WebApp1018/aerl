import { LayoutProps } from "../../components/layouts";
import { useSearchParams, usePathname } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useRef } from "react";
import { useToast } from "../../hooks/toast";
import { useRouter } from "next/router";

export default function AcceptInvitation(props: LayoutProps) {
    const searchParams = useSearchParams();
    const supabase = useSupabaseClient();
    const initialized = useRef(false)
    const { add } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const redirect = searchParams.get("accept_invite");

    const acceptInvitation = async () => {
        try {
            const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            const authenticated = aal.data?.currentLevel == "aal1" || aal.data?.currentLevel == "aal2";
            if (authenticated) {
                const org_invite_Id = searchParams.get('accept_invite');
                const { data } = await supabase.functions.invoke("accept-invite", {
                    body: {
                        orgInviteId: org_invite_Id,
                    },
                });

                if (data.success) {
                    add({
                        message: "Invitation Accepted",
                        description: "You have successfully joined the Organization.",
                        severity: "success",
                    });
                    router.push('/');
                } else {
                    throw Error(data?.error);
                }
            } else {
                router.push(`/login?redirect=${pathname}?accept_invite=${redirect}`);
            }
        }
        catch (error: any) {
            add({
                message: "Invitation Invalid",
                description: "You are not Authorized or you have already accepted the Invitation.",
                severity: "error",
            });
        }
    }
    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            acceptInvitation();
        }
    }, [])

    return (
        <></>
    );
}