use axum::{
    http::{header, StatusCode, Uri},
    response::{Html, IntoResponse, Response},
    routing::Router,
};
use mime_guess;
use rust_embed::RustEmbed;

// Load the SPA files and store in the binary
#[derive(RustEmbed)]
#[folder = "web/dist/"]
struct Assets;

pub async fn run() {
    let app = Router::new().fallback(static_handler);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn static_handler(uri: Uri) -> impl IntoResponse {
    let mut path = uri.path().trim_start_matches('/');

    match Assets::get(path) {
        Some(content) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();

            ([(header::CONTENT_TYPE, mime.as_ref())], content.data).into_response()
        }
        None => {
            let index = Assets::get("index.html").unwrap();
            Html(index.data).into_response()
        }
    }
}
