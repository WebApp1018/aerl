#explanation 

Some of our more power-user customers may want to create custom dashboards that are more advanced that what we can (and should) develop for in the Web UI. For this we offer a managed Grafana experience.

Each organisation gets a corresponding Grafana org that also maps the permissions. This is done with a custom auth proxy that Grafana calls whenever a user tries to access.

In order to run Grafana with high-availability and recover from crashes, we need to back it with either MySQL, Postgres or Sqlite3. Whichever fits our use-case best. Consider how we are going to have observability of this database and how we plan to back it up.

This could also give customers a more advanced way to configure alerting since Grafana supports that.
