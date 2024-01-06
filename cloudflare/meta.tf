# Better Uptime Status Page
resource "cloudflare_record" "status_page" {
    zone_id = cloudflare_zone.cloud.id
    name = "status"
    type = "CNAME"
    value = "statuspage.betteruptime.com"
    proxied = false
    comment = local.record_comment
}
