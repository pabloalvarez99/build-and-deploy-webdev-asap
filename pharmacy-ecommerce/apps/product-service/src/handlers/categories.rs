use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    models::{Category, CreateCategoryRequest, UpdateCategoryRequest},
    AppState,
};

pub async fn list_categories(
    State(state): State<AppState>,
) -> Result<Json<Vec<Category>>, (StatusCode, String)> {
    let categories = sqlx::query_as::<_, Category>(
        "SELECT * FROM categories WHERE active = true ORDER BY name"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(categories))
}

pub async fn get_category(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<Category>, (StatusCode, String)> {
    let category = sqlx::query_as::<_, Category>(
        "SELECT * FROM categories WHERE slug = $1"
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Category not found".to_string()))?;

    Ok(Json(category))
}

pub async fn create_category(
    State(state): State<AppState>,
    Json(payload): Json<CreateCategoryRequest>,
) -> Result<Json<Category>, (StatusCode, String)> {
    payload.validate().map_err(|e| {
        (StatusCode::BAD_REQUEST, format!("Validation error: {}", e))
    })?;

    // Check if slug already exists
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM categories WHERE slug = $1)"
    )
    .bind(&payload.slug)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if exists {
        return Err((StatusCode::CONFLICT, "Category slug already exists".to_string()));
    }

    let category = sqlx::query_as::<_, Category>(
        r#"
        INSERT INTO categories (name, slug, description, image_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#
    )
    .bind(&payload.name)
    .bind(&payload.slug)
    .bind(&payload.description)
    .bind(&payload.image_url)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(category))
}

pub async fn update_category(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateCategoryRequest>,
) -> Result<Json<Category>, (StatusCode, String)> {
    // Check if category exists
    let existing = sqlx::query_as::<_, Category>(
        "SELECT * FROM categories WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Category not found".to_string()))?;

    // Check slug uniqueness if changing
    if let Some(ref new_slug) = payload.slug {
        if new_slug != &existing.slug {
            let exists = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM categories WHERE slug = $1 AND id != $2)"
            )
            .bind(new_slug)
            .bind(id)
            .fetch_one(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            if exists {
                return Err((StatusCode::CONFLICT, "Category slug already exists".to_string()));
            }
        }
    }

    let category = sqlx::query_as::<_, Category>(
        r#"
        UPDATE categories SET
            name = COALESCE($1, name),
            slug = COALESCE($2, slug),
            description = COALESCE($3, description),
            image_url = COALESCE($4, image_url),
            active = COALESCE($5, active)
        WHERE id = $6
        RETURNING *
        "#
    )
    .bind(&payload.name)
    .bind(&payload.slug)
    .bind(&payload.description)
    .bind(&payload.image_url)
    .bind(&payload.active)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(category))
}

pub async fn delete_category(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    let result = sqlx::query("DELETE FROM categories WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Category not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
