# Snapshot: admin-locations-logo controller HTML responses

Use as input to visual regression checks of the uploaded logos and their variant alt-text
rendered on the admin locations pages served by `admin-locations-logo.controller`.

- `GET /locations/:id/logo` returns the uploaded `light` and `dark` previews and the
  current variant/alt state read from the page markup.
- `DELETE /locations/:id/logo` clears the page markup so the empty-state form is rendered.
