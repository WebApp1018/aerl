# Frontend IPv4 to Fly App
resource "cloudflare_record" "frontend_ipv4" {
    zone_id = cloudflare_zone.cloud.id
    name = "aerl.cloud"
    type = "A"
    value = local.frontend_ipv4
    proxied = true
    comment = local.record_comment
}

# Frontend IPv6 to Fly App
resource "cloudflare_record" "frontend_ipv6" {
    zone_id = cloudflare_zone.cloud.id
    name = "aerl.cloud"
    type = "AAAA"
    value = local.frontend_ipv6
    proxied = true
    comment = local.record_comment
}

locals {
    subdomain_instances = toset( [
        "aura",
        "redearth",
        "vaulta",
    ] )
}

# Instance IPv4 to Fly App
resource "cloudflare_record" "frontend_instance_ipv4" {
    for_each = local.subdomain_instances
    zone_id = cloudflare_zone.cloud.id
    name = "${each.key}.aerl.cloud"
    type = "A"
    value = local.frontend_ipv4
    proxied = true
    comment = local.record_comment
}

# Instance IPv6 to Fly App
resource "cloudflare_record" "frontend_instance_ipv6" {
    for_each = local.subdomain_instances
    zone_id = cloudflare_zone.cloud.id
    name = "${each.key}.aerl.cloud"
    type = "AAAA"
    value = local.frontend_ipv6
    proxied = true
    comment = local.record_comment
}

locals {
    domain_instances = toset( [
        "zekitek.cloud",
        "cdpower.cloud",
        "powerplus.online",
        "cet.live",
        "xess.cloud",
        "ampcontrol.energy",
    ] )
}

resource "cloudflare_zone" "instance" {
  for_each = local.domain_instances
  account_id = local.account_id
  zone       = each.key
}

resource "cloudflare_record" "instance_frontend_ipv4" {
    for_each = local.domain_instances
    zone_id = cloudflare_zone.instance[each.key].id
    name = each.key
    type = "A"
    value = local.frontend_ipv4
    proxied = true
    comment = local.record_comment
}

# Frontend IPv6 to Fly App
resource "cloudflare_record" "instance_frontend_ipv6" {
    for_each = local.domain_instances
    zone_id = cloudflare_zone.instance[each.key].id
    name = each.key
    type = "AAAA"
    value = local.frontend_ipv6
    proxied = true
    comment = local.record_comment
}
