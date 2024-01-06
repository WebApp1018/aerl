#explanation 

Some customers would like to be provided with a branded experience that they can re-sell.

# Domain Name

Customers have two options:
1. Custom subdomain
2. Custom domain

Both require a subdomain.

## Custom Subdomain

Customer selects a subdomain like `<custom-subdomain>.aerl.cloud`.

## Custom Domain

Custom domains are provided by having the customer point their preferred domain to a subdomain under the `aerl.cloud` domain.

E.g. `planet.energy -> CNAME -> planet-energy.aerl.cloud`.

The requirement to CNAME to a subdomain is not strictly necessary for our current design, but will be very useful if we change to having a reverse proxy in front of the web interface.

## Certificates

For Fly to serve HTTPS traffic it will need to have the SSL certificate added manually.
