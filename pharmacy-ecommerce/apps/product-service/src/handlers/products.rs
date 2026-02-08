use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::{
    models::{
        CreateProductRequest, PaginatedProducts, Product, ProductQuery,
        ProductWithCategory, UpdateProductRequest,
    },
    AppState,
};

pub async fn list_products(
    State(state): State<AppState>,
    Query(query): Query<ProductQuery>,
) -> Result<Json<PaginatedProducts>, (StatusCode, String)> {
    let page = query.page.unwrap_or(1).max(1);
    let limit = query.limit.unwrap_or(12).min(100);
    let offset = (page - 1) * limit;
    let active_only = query.active_only.unwrap_or(true);

    // Build dynamic query
    let mut conditions = vec![];
    let mut params: Vec<String> = vec![];

    if active_only {
        conditions.push("p.active = true".to_string());
    }

    if let Some(ref category) = query.category {
        params.push(category.clone());
        conditions.push(format!("c.slug = ${}", params.len()));
    }

    if let Some(ref search) = query.search {
        params.push(format!("%{}%", search));
        conditions.push(format!(
            "(p.name ILIKE ${} OR p.description ILIKE ${} OR p.laboratory ILIKE ${})",
            params.len(),
            params.len(),
            params.len()
        ));
    }

    if let Some(ref laboratory) = query.laboratory {
        params.push(laboratory.clone());
        conditions.push(format!("p.laboratory = ${}", params.len()));
    }

    let where_clause = if conditions.is_empty() {
        "".to_string()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    // Get total count
    let count_query = format!(
        r#"
        SELECT COUNT(*) as count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        {}
        "#,
        where_clause
    );

    // This is a simplified approach - in production you'd use a query builder
    let total: i64 = if query.category.is_some() && query.search.is_some() {
        sqlx::query_scalar(&count_query)
            .bind(&query.category)
            .bind(&format!("%{}%", query.search.as_ref().unwrap()))
            .fetch_one(&state.db)
            .await
    } else if query.category.is_some() {
        sqlx::query_scalar(&count_query)
            .bind(&query.category)
            .fetch_one(&state.db)
            .await
    } else if query.search.is_some() {
        sqlx::query_scalar(&count_query)
            .bind(&format!("%{}%", query.search.as_ref().unwrap()))
            .fetch_one(&state.db)
            .await
    } else {
        sqlx::query_scalar(&count_query)
            .fetch_one(&state.db)
            .await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Determine sort order
    let order_clause = match query.sort_by.as_deref() {
        Some("name") | Some("name_asc") => "p.name ASC",
        Some("name_desc") => "p.name DESC",
        Some("price_asc") => "p.price ASC",
        Some("price_desc") => "p.price DESC",
        Some("stock") | Some("stock_desc") => "p.stock DESC",
        Some("stock_asc") => "p.stock ASC",
        _ => "p.created_at DESC",
    };

    // Get products
    let products_query = format!(
        r#"
        SELECT
            p.*,
            c.name as category_name,
            c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        {}
        ORDER BY {}
        LIMIT {} OFFSET {}
        "#,
        where_clause, order_clause, limit, offset
    );

    #[derive(sqlx::FromRow)]
    struct ProductRow {
        id: Uuid,
        name: String,
        slug: String,
        description: Option<String>,
        price: rust_decimal::Decimal,
        stock: i32,
        category_id: Option<Uuid>,
        image_url: Option<String>,
        active: bool,
        external_id: Option<String>,
        laboratory: Option<String>,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
        category_name: Option<String>,
        category_slug: Option<String>,
    }

    let rows: Vec<ProductRow> = if query.category.is_some() && query.search.is_some() {
        sqlx::query_as(&products_query)
            .bind(&query.category)
            .bind(&format!("%{}%", query.search.as_ref().unwrap()))
            .fetch_all(&state.db)
            .await
    } else if query.category.is_some() {
        sqlx::query_as(&products_query)
            .bind(&query.category)
            .fetch_all(&state.db)
            .await
    } else if query.search.is_some() {
        sqlx::query_as(&products_query)
            .bind(&format!("%{}%", query.search.as_ref().unwrap()))
            .fetch_all(&state.db)
            .await
    } else {
        sqlx::query_as(&products_query)
            .fetch_all(&state.db)
            .await
    }
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let products: Vec<ProductWithCategory> = rows
        .into_iter()
        .map(|row| ProductWithCategory {
            product: Product {
                id: row.id,
                name: row.name,
                slug: row.slug,
                description: row.description,
                price: row.price,
                stock: row.stock,
                category_id: row.category_id,
                image_url: row.image_url,
                active: row.active,
                external_id: row.external_id,
                laboratory: row.laboratory,
                created_at: row.created_at,
                updated_at: row.updated_at,
            },
            category_name: row.category_name,
            category_slug: row.category_slug,
        })
        .collect();

    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok(Json(PaginatedProducts {
        products,
        total,
        page,
        limit,
        total_pages,
    }))
}

pub async fn get_product(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Result<Json<ProductWithCategory>, (StatusCode, String)> {
    #[derive(sqlx::FromRow)]
    struct ProductRow {
        id: Uuid,
        name: String,
        slug: String,
        description: Option<String>,
        price: rust_decimal::Decimal,
        stock: i32,
        category_id: Option<Uuid>,
        image_url: Option<String>,
        active: bool,
        external_id: Option<String>,
        laboratory: Option<String>,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
        category_name: Option<String>,
        category_slug: Option<String>,
    }

    let row = sqlx::query_as::<_, ProductRow>(
        r#"
        SELECT
            p.*,
            c.name as category_name,
            c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = $1
        "#
    )
    .bind(&slug)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Product not found".to_string()))?;

    Ok(Json(ProductWithCategory {
        product: Product {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            price: row.price,
            stock: row.stock,
            category_id: row.category_id,
            image_url: row.image_url,
            active: row.active,
            external_id: row.external_id,
            laboratory: row.laboratory,
            created_at: row.created_at,
            updated_at: row.updated_at,
        },
        category_name: row.category_name,
        category_slug: row.category_slug,
    }))
}

pub async fn get_product_by_id(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ProductWithCategory>, (StatusCode, String)> {
    #[derive(sqlx::FromRow)]
    struct ProductRow {
        id: Uuid,
        name: String,
        slug: String,
        description: Option<String>,
        price: rust_decimal::Decimal,
        stock: i32,
        category_id: Option<Uuid>,
        image_url: Option<String>,
        active: bool,
        external_id: Option<String>,
        laboratory: Option<String>,
        created_at: chrono::DateTime<chrono::Utc>,
        updated_at: chrono::DateTime<chrono::Utc>,
        category_name: Option<String>,
        category_slug: Option<String>,
    }

    let row = sqlx::query_as::<_, ProductRow>(
        r#"
        SELECT
            p.*,
            c.name as category_name,
            c.slug as category_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
        "#
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Product not found".to_string()))?;

    Ok(Json(ProductWithCategory {
        product: Product {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            price: row.price,
            stock: row.stock,
            category_id: row.category_id,
            image_url: row.image_url,
            active: row.active,
            external_id: row.external_id,
            laboratory: row.laboratory,
            created_at: row.created_at,
            updated_at: row.updated_at,
        },
        category_name: row.category_name,
        category_slug: row.category_slug,
    }))
}

pub async fn create_product(
    State(state): State<AppState>,
    Json(payload): Json<CreateProductRequest>,
) -> Result<Json<Product>, (StatusCode, String)> {
    payload.validate().map_err(|e| {
        (StatusCode::BAD_REQUEST, format!("Validation error: {}", e))
    })?;

    // Check if slug already exists
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM products WHERE slug = $1)"
    )
    .bind(&payload.slug)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if exists {
        return Err((StatusCode::CONFLICT, "Product slug already exists".to_string()));
    }

    let product = sqlx::query_as::<_, Product>(
        r#"
        INSERT INTO products (name, slug, description, price, stock, category_id, image_url, laboratory, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#
    )
    .bind(&payload.name)
    .bind(&payload.slug)
    .bind(&payload.description)
    .bind(&payload.price)
    .bind(&payload.stock)
    .bind(&payload.category_id)
    .bind(&payload.image_url)
    .bind(&payload.laboratory)
    .bind(&payload.active)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(product))
}

pub async fn update_product(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateProductRequest>,
) -> Result<Json<Product>, (StatusCode, String)> {
    // Check if product exists
    let existing = sqlx::query_as::<_, Product>(
        "SELECT * FROM products WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Product not found".to_string()))?;

    // Check slug uniqueness if changing
    if let Some(ref new_slug) = payload.slug {
        if new_slug != &existing.slug {
            let exists = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM products WHERE slug = $1 AND id != $2)"
            )
            .bind(new_slug)
            .bind(id)
            .fetch_one(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

            if exists {
                return Err((StatusCode::CONFLICT, "Product slug already exists".to_string()));
            }
        }
    }

    let product = sqlx::query_as::<_, Product>(
        r#"
        UPDATE products SET
            name = COALESCE($1, name),
            slug = COALESCE($2, slug),
            description = COALESCE($3, description),
            price = COALESCE($4, price),
            stock = COALESCE($5, stock),
            category_id = COALESCE($6, category_id),
            image_url = COALESCE($7, image_url),
            active = COALESCE($8, active),
            laboratory = COALESCE($9, laboratory),
            updated_at = NOW()
        WHERE id = $10
        RETURNING *
        "#
    )
    .bind(&payload.name)
    .bind(&payload.slug)
    .bind(&payload.description)
    .bind(&payload.price)
    .bind(&payload.stock)
    .bind(&payload.category_id)
    .bind(&payload.image_url)
    .bind(&payload.active)
    .bind(&payload.laboratory)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(product))
}

pub async fn delete_product(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    let result = sqlx::query("DELETE FROM products WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Product not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
