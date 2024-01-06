#explanation 

We provide public documentation for AERL cloud at `docs.aerl.cloud`.

Since the content is simple it is statically generated html files served from an R2 bucket with some Cloudflare transformation rules to fix some request behaviour.

# Notable tranformation rules

There are two notable transformation rules.

The first matches when the root page is loaded, rewriting the request to `/index.html`

The second is more complicated. If the URI path doesn't include a `.` we're assuming they're trying to load a page and are missing the `.html` extention (which is expected). So it concatonates `.html` to the end of the path.
