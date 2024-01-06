# Supabase API
resource "cloudflare_record" "service_supabase_api" {
    zone_id = cloudflare_zone.cloud.id
    name = "sb"
    type = "CNAME"
    value = "mzynufuthvghqanlkluf.supabase.co"
    proxied = false
    comment = local.record_comment
}

resource "cloudflare_record" "service_supabase_api_txt_1" {
    zone_id = cloudflare_zone.cloud.id
    name = "sb"
    type = "TXT"
    value = "ca3-a6ea3d659b6042919bfd44a441f35cb8"
    comment = local.record_comment
}

resource "cloudflare_record" "service_supabase_api_txt_2" {
    zone_id = cloudflare_zone.cloud.id
    name = "_cf-custom-hostname.sb"
    type = "TXT"
    value = "18f9ddec-b05a-4d24-8686-cabb66bb57b1"
    comment = local.record_comment
}

# Boundary
resource "cloudflare_record" "serivce_boundary" {
    zone_id = cloudflare_zone.cloud.id
    name = "boundary.service"
    type = "CNAME"
    value = "boundary-aerl-cloud.fly.dev"
    proxied = false
    comment = local.record_comment
}

# API
resource "cloudflare_record" "api" {
    zone_id = cloudflare_zone.cloud.id
    name = "api"
    type = "CNAME"
    value = "boundary-aerl-cloud.fly.dev"
    proxied = false
    comment = local.record_comment
}
