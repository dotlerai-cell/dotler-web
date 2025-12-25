# main.py - Complete version with enhanced analytics endpoints

import os
from urllib.parse import urlencode
from datetime import datetime, timedelta
from typing import Optional
import json

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse, JSONResponse
from pydantic import BaseModel
from google.ads.googleads.client import GoogleAdsClient
from datetime import date, timedelta

from motor.motor_asyncio import AsyncIOMotorClient

# =======================
# ENV CONFIG
# =======================

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_ADS_REDIRECT_URI = os.getenv("GOOGLE_ADS_REDIRECT_URI")
SCOPES = ["https://www.googleapis.com/auth/adwords", "https://www.googleapis.com/auth/userinfo.email"]

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "trackerdb")
MONGO_COLLECTION = os.getenv("MONGO_COLLECTION", "tracking_events")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000")

if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET):
    raise RuntimeError("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env")

# =======================
# IN-MEMORY USER STORE
# =======================
USER_CONNECTIONS: dict[str, dict] = {}

# =======================
# FASTAPI SETUP
# =======================

app = FastAPI(title="BYO Google Ads Connector with Enhanced Analytics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# =======================
# MONGODB SETUP
# =======================

mongodb_client: Optional[AsyncIOMotorClient] = None
db = None
tracking_collection = None

@app.on_event("startup")
async def startup_db_client():
    global mongodb_client, db, tracking_collection
    try:
        mongodb_client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        db = mongodb_client[MONGO_DB]
        tracking_collection = db[MONGO_COLLECTION]
        
        # Test connection first
        await mongodb_client.admin.command('ping')
        
        # Create indexes
        await tracking_collection.create_index("site_id")
        await tracking_collection.create_index("session_id")
        await tracking_collection.create_index("event_type")
        await tracking_collection.create_index("timestamp")
        await tracking_collection.create_index([("site_id", 1), ("timestamp", -1)])
        
        print(f"✅ MongoDB connected successfully to {MONGO_URI}")
        print(f"   Database: {MONGO_DB}")
        print(f"   Collection: {MONGO_COLLECTION}")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print(f"   Make sure MongoDB is running at {MONGO_URI}")
        mongodb_client = None

@app.on_event("shutdown")
async def shutdown_db_client():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("MongoDB connection closed")

# =======================
# STATIC FILES
# =======================
from fastapi.staticfiles import StaticFiles
import pathlib

static_dir = pathlib.Path(__file__).parent / "static"
static_dir.mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/health")
async def health():
    mongo_status = "disconnected"
    if mongodb_client is not None:
        try:
            await mongodb_client.admin.command('ping')
            mongo_status = "connected"
        except:
            mongo_status = "error"
    
    return {
        "status": "ok",
        "mongodb": mongo_status
    }


# =======================
# SERVE FRONTEND
# =======================

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    import pathlib
    
    possible_paths = [
        pathlib.Path(__file__).parent.parent / "frontend" / "index.html",
        pathlib.Path(__file__).parent / "frontend" / "index.html",
        pathlib.Path("frontend") / "index.html",
        pathlib.Path("index.html"),
    ]
    
    for path in possible_paths:
        if path.exists():
            print(f"[SERVE] Serving index.html from: {path}")
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
    
    return HTMLResponse(
        f"<h1>index.html not found</h1><p>Searched in: {[str(p.absolute()) for p in possible_paths]}</p>",
        status_code=404
    )


# =======================
# MODELS
# =======================

class UserConfig(BaseModel):
    user_id: str
    developer_token: str
    login_customer_id: str | None = None


class TrackingEvent(BaseModel):
    site_id: str
    session_id: str
    event_type: str
    page_url: str
    page_title: Optional[str] = None
    referrer: Optional[str] = None
    timestamp: str
    user_agent: Optional[str] = None
    screen_width: Optional[int] = None
    screen_height: Optional[int] = None
    click_id: Optional[str] = None
    element_text: Optional[str] = None
    element_tag: Optional[str] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    is_external: Optional[bool] = None
    time_on_page: Optional[int] = None
    consent_given: Optional[bool] = None

class ContactForm(BaseModel):
    name: str
    email: str
    subject: str
    message: str 

# =======================
# TRACKING API ENDPOINTS
# =======================

@app.post("/api/tracking/track")
async def track_event(event: TrackingEvent):
    if tracking_collection is None:
        return JSONResponse(
            {"error": "MongoDB not connected"},
            status_code=503
        )
    
    try:
        event_dict = event.dict()
        event_dict["created_at"] = datetime.utcnow()
        
        result = await tracking_collection.insert_one(event_dict)
        
        print(f"✅ Tracked event: {event.event_type} for site: {event.site_id}")
        
        return JSONResponse(
            {
                "status": "ok",
                "event_id": str(result.inserted_id)
            },
            status_code=201
        )
    except Exception as e:
        print(f"❌ MongoDB error: {e}")
        return JSONResponse(
            {"error": f"Failed to save event: {str(e)}"},
            status_code=500
        )


# =======================
# ENHANCED ANALYTICS ENDPOINTS
# =======================

@app.get("/api/analytics/overview")
async def get_analytics_overview(site_id: str):
    """Get comprehensive analytics overview with calculated metrics"""
    if tracking_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    
    try:
        print(f"📊 Fetching analytics overview for site_id: {site_id}")
        
        # Get unique sessions (users)
        unique_sessions = await tracking_collection.distinct("session_id", {"site_id": site_id})
        total_users = len(unique_sessions)
        
        # Get total events
        total_events = await tracking_collection.count_documents({"site_id": site_id})
        
        # Get total pageviews
        total_pageviews = await tracking_collection.count_documents({
            "site_id": site_id,
            "event_type": "pageview"
        })
        
        # Calculate pages per user
        pages_per_user = round(total_pageviews / total_users, 2) if total_users > 0 else 0
        
        # Get average time on page
        time_pipeline = [
            {"$match": {
                "site_id": site_id,
                "event_type": "page_exit",
                "time_on_page": {"$exists": True, "$ne": None}
            }},
            {"$group": {
                "_id": None,
                "avg_time": {"$avg": "$time_on_page"}
            }}
        ]
        
        time_result = await tracking_collection.aggregate(time_pipeline).to_list(1)
        avg_time_on_page = round(time_result[0]["avg_time"], 1) if time_result else 0
        
        # Get page visit statistics
        page_stats_pipeline = [
            {"$match": {
                "site_id": site_id,
                "event_type": "pageview"
            }},
            {"$group": {
                "_id": "$page_url",
                "total_visits": {"$sum": 1},
                "unique_users": {"$addToSet": "$session_id"}
            }},
            {"$project": {
                "page_url": "$_id",
                "total_visits": 1,
                "unique_users": {"$size": "$unique_users"},
                "_id": 0
            }},
            {"$sort": {"total_visits": -1}}
        ]
        
        page_stats = await tracking_collection.aggregate(page_stats_pipeline).to_list(100)
        
        # Calculate percentages and averages for each page
        enhanced_page_stats = []
        for page in page_stats:
            user_percentage = round((page["unique_users"] / total_users * 100), 1) if total_users > 0 else 0
            avg_visits_per_user = round(page["total_visits"] / page["unique_users"], 2) if page["unique_users"] > 0 else 0
            
            # Get average time on this specific page
            page_time_pipeline = [
                {"$match": {
                    "site_id": site_id,
                    "event_type": "page_exit",
                    "page_url": page["page_url"],
                    "time_on_page": {"$exists": True, "$ne": None}
                }},
                {"$group": {
                    "_id": None,
                    "avg_time": {"$avg": "$time_on_page"}
                }}
            ]
            
            page_time_result = await tracking_collection.aggregate(page_time_pipeline).to_list(1)
            avg_time = round(page_time_result[0]["avg_time"], 1) if page_time_result else 0
            
            enhanced_page_stats.append({
                "page_url": page["page_url"],
                "total_visits": page["total_visits"],
                "unique_users": page["unique_users"],
                "user_percentage": user_percentage,
                "avg_visits_per_user": avg_visits_per_user,
                "avg_time_seconds": avg_time,
                "avg_time_formatted": format_duration(avg_time)
            })
        
        # Get click statistics
        click_stats_pipeline = [
            {"$match": {
                "site_id": site_id,
                "event_type": {"$in": ["click", "link_click"]}
            }},
            {"$group": {
                "_id": "$page_url",
                "total_clicks": {"$sum": 1},
                "unique_clickers": {"$addToSet": "$session_id"}
            }},
            {"$project": {
                "page_url": "$_id",
                "total_clicks": 1,
                "unique_clickers": {"$size": "$unique_clickers"},
                "_id": 0
            }},
            {"$sort": {"total_clicks": -1}}
        ]
        
        click_stats = await tracking_collection.aggregate(click_stats_pipeline).to_list(100)
        
        enhanced_click_stats = []
        for page in click_stats:
            clicker_percentage = round((page["unique_clickers"] / total_users * 100), 1) if total_users > 0 else 0
            avg_clicks_per_user = round(page["total_clicks"] / page["unique_clickers"], 2) if page["unique_clickers"] > 0 else 0
            
            enhanced_click_stats.append({
                "page_url": page["page_url"],
                "total_clicks": page["total_clicks"],
                "unique_clickers": page["unique_clickers"],
                "clicker_percentage": clicker_percentage,
                "avg_clicks_per_user": avg_clicks_per_user
            })
        
        # Get event type distribution
        event_type_pipeline = [
            {"$match": {"site_id": site_id}},
            {"$group": {
                "_id": "$event_type",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        
        event_types = {}
        async for doc in tracking_collection.aggregate(event_type_pipeline):
            event_types[doc["_id"]] = doc["count"]
        
        overview_data = {
            "total_users": total_users,
            "total_events": total_events,
            "total_pageviews": total_pageviews,
            "pages_per_user": pages_per_user,
            "avg_time_on_page_seconds": avg_time_on_page,
            "avg_time_on_page_formatted": format_duration(avg_time_on_page),
            "event_type_distribution": event_types,
            "page_statistics": enhanced_page_stats,
            "click_statistics": enhanced_click_stats
        }
        
        print(f"✅ Analytics overview generated successfully")
        
        return JSONResponse(overview_data)
        
    except Exception as e:
        print(f"❌ Error generating analytics overview: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {"error": f"Failed to generate analytics: {str(e)}"},
            status_code=500
        )
    
@app.get("/api/analytics/consent-stats")
async def get_consent_stats(site_id: str):
    """Get cookie consent acceptance statistics"""
    if tracking_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    
    try:
        # Get total unique sessions
        unique_sessions = await tracking_collection.distinct("session_id", {"site_id": site_id})
        total_sessions = len(unique_sessions)
        
        # Get sessions that made a consent decision
        consent_pipeline = [
            {"$match": {
                "site_id": site_id,
                "event_type": "consent_decision"
            }},
            {"$group": {
                "_id": "$session_id",
                "consent_given": {"$first": "$consent_given"}
            }}
        ]
        
        consent_decisions = await tracking_collection.aggregate(consent_pipeline).to_list(10000)
        
        accepted_count = sum(1 for d in consent_decisions if d.get("consent_given") == True)
        declined_count = sum(1 for d in consent_decisions if d.get("consent_given") == False)
        total_decisions = len(consent_decisions)
        
        acceptance_rate = round((accepted_count / total_decisions * 100), 1) if total_decisions > 0 else 0
        
        return JSONResponse({
            "total_sessions": total_sessions,
            "total_decisions": total_decisions,
            "accepted_count": accepted_count,
            "declined_count": declined_count,
            "acceptance_rate": acceptance_rate,
            "no_decision_count": total_sessions - total_decisions
        })
        
    except Exception as e:
        print(f"❌ Error getting consent stats: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {"error": f"Failed to get consent stats: {str(e)}"},
            status_code=500
        )

def format_duration(seconds):
    """Format seconds into human-readable duration"""
    if seconds < 60:
        return f"{int(seconds)}s"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs}s"
    else:
        hours = int(seconds / 3600)
        minutes = int((seconds % 3600) / 60)
        return f"{hours}h {minutes}m"


@app.get("/api/analytics/user-behavior")
async def get_user_behavior(site_id: str):
    """Get user behavior patterns and journey analytics"""
    if tracking_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    
    try:
        # Get user journey patterns
        journey_pipeline = [
            {"$match": {
                "site_id": site_id,
                "event_type": "pageview"
            }},
            {"$sort": {"session_id": 1, "timestamp": 1}},
            {"$group": {
                "_id": "$session_id",
                "pages": {"$push": "$page_url"}
            }},
            {"$project": {
                "first_page": {"$arrayElemAt": ["$pages", 0]},
                "last_page": {"$arrayElemAt": ["$pages", -1]},
                "page_count": {"$size": "$pages"}
            }}
        ]
        
        journeys = await tracking_collection.aggregate(journey_pipeline).to_list(1000)
        
        # Analyze entry and exit pages
        entry_pages = {}
        exit_pages = {}
        page_counts = []
        
        for journey in journeys:
            first = journey.get("first_page")
            last = journey.get("last_page")
            count = journey.get("page_count", 0)
            
            if first:
                entry_pages[first] = entry_pages.get(first, 0) + 1
            if last:
                exit_pages[last] = exit_pages.get(last, 0) + 1
            if count:
                page_counts.append(count)
        
        avg_pages_per_session = round(sum(page_counts) / len(page_counts), 2) if page_counts else 0
        
        top_entry_pages = sorted(entry_pages.items(), key=lambda x: x[1], reverse=True)[:10]
        top_exit_pages = sorted(exit_pages.items(), key=lambda x: x[1], reverse=True)[:10]
        
        behavior_data = {
            "avg_pages_per_session": avg_pages_per_session,
            "total_sessions": len(journeys),
            "top_entry_pages": [{"page": p, "count": c} for p, c in top_entry_pages],
            "top_exit_pages": [{"page": p, "count": c} for p, c in top_exit_pages]
        }
        
        return JSONResponse(behavior_data)
        
    except Exception as e:
        print(f"❌ Error getting user behavior: {e}")
        return JSONResponse(
            {"error": f"Failed to get user behavior: {str(e)}"},
            status_code=500
        )

@app.get("/api/analytics/metric-details")
async def get_metric_details(site_id: str, metric_type: str, days: int = 30):
    """Get daily breakdown of a specific metric for graphing"""
    if tracking_collection is None:
        return JSONResponse({"error": "MongoDB not connected"}, status_code=503)
    
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        daily_data = []
        
        if metric_type == "users":
            # Daily unique users
            for i in range(days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                unique_sessions = await tracking_collection.distinct(
                    "session_id",
                    {
                        "site_id": site_id,
                        "created_at": {"$gte": day_start, "$lt": day_end}
                    }
                )
                
                daily_data.append({
                    "date": day_start.strftime("%Y-%m-%d"),
                    "value": len(unique_sessions)
                })
        
        elif metric_type == "pageviews":
            # Daily pageviews
            for i in range(days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                count = await tracking_collection.count_documents({
                    "site_id": site_id,
                    "event_type": "pageview",
                    "created_at": {"$gte": day_start, "$lt": day_end}
                })
                
                daily_data.append({
                    "date": day_start.strftime("%Y-%m-%d"),
                    "value": count
                })
        
        elif metric_type == "pages_per_user":
            # Daily pages per user
            for i in range(days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                pageviews = await tracking_collection.count_documents({
                    "site_id": site_id,
                    "event_type": "pageview",
                    "created_at": {"$gte": day_start, "$lt": day_end}
                })
                
                unique_sessions = await tracking_collection.distinct(
                    "session_id",
                    {
                        "site_id": site_id,
                        "created_at": {"$gte": day_start, "$lt": day_end}
                    }
                )
                
                users = len(unique_sessions)
                avg = round(pageviews / users, 2) if users > 0 else 0
                
                daily_data.append({
                    "date": day_start.strftime("%Y-%m-%d"),
                    "value": avg
                })
        
        elif metric_type == "avg_time":
            # Daily average time on page
            for i in range(days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                pipeline = [
                    {"$match": {
                        "site_id": site_id,
                        "event_type": "page_exit",
                        "time_on_page": {"$exists": True, "$ne": None},
                        "created_at": {"$gte": day_start, "$lt": day_end}
                    }},
                    {"$group": {
                        "_id": None,
                        "avg_time": {"$avg": "$time_on_page"}
                    }}
                ]
                
                result = await tracking_collection.aggregate(pipeline).to_list(1)
                avg_time = round(result[0]["avg_time"], 1) if result else 0
                
                daily_data.append({
                    "date": day_start.strftime("%Y-%m-%d"),
                    "value": avg_time
                })
        
        elif metric_type == "events":
            # Daily total events
            for i in range(days):
                day_start = start_date + timedelta(days=i)
                day_end = day_start + timedelta(days=1)
                
                count = await tracking_collection.count_documents({
                    "site_id": site_id,
                    "created_at": {"$gte": day_start, "$lt": day_end}
                })
                
                daily_data.append({
                    "date": day_start.strftime("%Y-%m-%d"),
                    "value": count
                })
        
        return JSONResponse({
            "metric_type": metric_type,
            "days": days,
            "data": daily_data
        })
        
    except Exception as e:
        print(f"❌ Error getting metric details: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {"error": f"Failed to get metric details: {str(e)}"},
            status_code=500
        )
# =======================
# ORIGINAL ENDPOINTS (unchanged)
# =======================

@app.post("/api/reset-setup")
async def reset_setup(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    
    if user_id and user_id in SETUP_STATE:
        del SETUP_STATE[user_id]
    
    return JSONResponse({"status": "ok"})

@app.post("/api/save-oauth-tokens")
async def save_oauth_tokens(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    access_token = body.get("access_token")
    refresh_token = body.get("refresh_token")
    email = body.get("email")
    
    print(f"[OAUTH] Saving tokens for user_id: {user_id}")
    print(f"[OAUTH] Has access_token: {bool(access_token)}")
    print(f"[OAUTH] Has refresh_token: {bool(refresh_token)}")
    print(f"[OAUTH] Email: {email}")
    
    if not all([user_id, access_token, refresh_token]):
        print(f"[OAUTH] Missing required tokens: user_id={bool(user_id)}, access_token={bool(access_token)}, refresh_token={bool(refresh_token)}")
        return JSONResponse({"error": "Missing required tokens"}, status_code=400)
    
    entry = USER_CONNECTIONS.get(user_id, {})
    entry["access_token"] = access_token
    entry["refresh_token"] = refresh_token
    if email:
        entry["email"] = email
    USER_CONNECTIONS[user_id] = entry
    
    print(f"[OAUTH] Tokens saved successfully for {user_id}")
    print(f"[OAUTH] Current USER_CONNECTIONS keys: {list(USER_CONNECTIONS.keys())}")
    
    return JSONResponse({"status": "ok"})

@app.post("/config")
async def save_user_config(config: UserConfig):
    dev_token = config.developer_token.strip()
    login_id = (config.login_customer_id or "").strip().replace("-", "")

    if not dev_token:
        return JSONResponse(
            {"error": "Developer token cannot be empty."},
            status_code=400,
        )

    # For agentic setup, we need to get the OAuth tokens from the main Dotler app
    # The main Dotler app should have already authenticated the user
    entry = USER_CONNECTIONS.get(config.user_id, {})
    
    # If no OAuth tokens exist, we need to get them
    if not entry.get("refresh_token"):
        # This means the user needs to authenticate with Google Ads scope
        # Return a special response indicating OAuth is needed
        return JSONResponse(
            {"error": "oauth_required", "auth_url": f"/auth/google?user_id={config.user_id}"},
            status_code=401
        )
    
    entry["developer_token"] = dev_token
    entry["login_customer_id"] = login_id
    USER_CONNECTIONS[config.user_id] = entry

    return {"status": "ok"}


@app.get("/auth/google")
async def auth_google(request: Request):
    user_id = request.query_params.get("user_id", "default_user")
    setup_data = request.query_params.get("setup_data")
    from_agentic = request.query_params.get("from_agentic")
    state = request.query_params.get("state", "main_app")  # Default to main_app
    
    print(f"[AUTH] Starting OAuth flow for user_id: {user_id}, state: {state}, from_agentic: {from_agentic}")
    
    # Force main app flow unless explicitly agentic
    if not from_agentic and not setup_data:
        state = "main_app"
        redirect_uri = REDIRECT_URI
    else:
        # Agentic flow
        redirect_uri = GOOGLE_ADS_REDIRECT_URI
        if setup_data:
            state = f"{user_id}|agentic|{setup_data}"
    
    print(f"[AUTH] Using state: {state}, redirect_uri: {redirect_uri}")
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    print(f"[AUTH] OAuth URL: {url}")
    return RedirectResponse(url, status_code=302)


@app.get("/oauth2/callback")
async def oauth2_callback(request: Request):
    code = request.query_params.get("code")
    error = request.query_params.get("error")
    state = request.query_params.get("state")

    print(f"[OAUTH] Callback received - code: {bool(code)}, error: {error}, state: '{state}'")
    print(f"[OAUTH] FRONTEND_URL: {FRONTEND_URL}")

    if error:
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error={error}")

    if not code:
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error=missing_code")

    # FORCE main app detection - any OAuth without agentic markers is main app
    is_main_app = True
    is_agentic = False
    setup_data_json = None
    user_id = "main_app"
    
    # Only override if this is explicitly agentic with encoded data
    if state and "|agentic|" in str(state):
        state_parts = str(state).split("|")
        user_id = state_parts[0]
        is_agentic = True
        setup_data_json = state_parts[2] if len(state_parts) > 2 else None
        is_main_app = False
    
    print(f"[OAUTH] FORCED MAIN APP: is_main_app={is_main_app}, is_agentic={is_agentic}")

    # Always use main app redirect URI unless explicitly agentic
    redirect_uri = REDIRECT_URI

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    try:
        resp = requests.post(token_url, data=data)
        token_data = resp.json()
        print(f"[OAUTH] Token exchange response: {token_data.keys()}")
    except Exception as e:
        print(f"[OAUTH] Token exchange failed: {e}")
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error=token_exchange_failed")

    if "error" in token_data:
        print(f"[OAUTH] Token error: {token_data.get('error')}")
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error={token_data.get('error')}")

    refresh_token = token_data.get("refresh_token")
    access_token = token_data.get("access_token")

    if not refresh_token:
        print(f"[OAUTH] No refresh token received")
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error=no_refresh_token")

    # Fetch user email from Google
    user_email = None
    user_name = None
    if access_token:
        try:
            userinfo_resp = requests.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if userinfo_resp.status_code == 200:
                userinfo = userinfo_resp.json()
                user_email = userinfo.get("email")
                user_name = userinfo.get("name")
                print(f"[OAUTH] Got user info: {user_email}")
        except Exception as e:
            print(f"[OAUTH] Failed to get user info: {e}")

    if not user_email:
        print(f"[OAUTH] No user email received")
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error=no_user_email")

    # Store tokens using email as key for main app users
    storage_key = user_email if is_main_app else user_id
    
    entry = USER_CONNECTIONS.get(storage_key, {})
    entry["refresh_token"] = refresh_token
    entry["access_token"] = access_token
    entry["email"] = user_email
    if user_name:
        entry["name"] = user_name
    USER_CONNECTIONS[storage_key] = entry

    print(f"[OAUTH] Stored tokens for key: {storage_key}")
    print(f"[OAUTH] Available keys: {list(USER_CONNECTIONS.keys())}")

    # Handle agentic setup completion
    if is_agentic and setup_data_json:
        try:
            import json
            setup_data = json.loads(setup_data_json)
            
            # Save the setup data
            entry["developer_token"] = setup_data["developer_token"]
            entry["login_customer_id"] = setup_data["manager_id"]
            USER_CONNECTIONS[storage_key] = entry
            
            # Fetch campaign data
            client = build_google_ads_client_for_user(storage_key)
            customer_id = setup_data["campaign_id"]
            
            last_week = fetch_campaign_metrics_for_range(client, customer_id, "LAST_7_DAYS")
            last_month = fetch_campaign_metrics_for_range(client, customer_id, "LAST_30_DAYS")
            last_year = fetch_campaign_metrics_for_range(client, customer_id, "LAST_YEAR")
            
            performance_data = {
                "customer_id": customer_id,
                "last_week": last_week,
                "last_month": last_month,
                "last_year": last_year
            }
            
            # Redirect to Google Ads app with data
            from urllib.parse import quote
            params = {
                "user_id": setup_data["username"],
                "setup_complete": "true",
                "performance_data": quote(json.dumps(performance_data))
            }
            
            redirect_url = f"{FRONTEND_URL}/src/GoogleAdsConsentManagement/index.html?" + "&".join([f"{k}={v}" for k, v in params.items()])
            return RedirectResponse(redirect_url)
            
        except Exception as e:
            print(f"Error completing agentic setup: {e}")
            return RedirectResponse(f"{FRONTEND_URL}/auth/callback?error=agentic_setup_failed")

    # ALWAYS redirect to main app auth/callback for non-agentic flows
    print(f"[OAUTH] ✅ MAIN APP FLOW - redirecting to auth/callback")
    from urllib.parse import quote
    redirect_url = f"{FRONTEND_URL}/auth/callback?user_id={quote(storage_key)}&email={quote(user_email)}"
    print(f"[OAUTH] ✅ MAIN APP Redirect URL: {redirect_url}")
    return RedirectResponse(redirect_url)


def build_google_ads_client_for_user(user_id: str) -> GoogleAdsClient:
    print(f"[CLIENT] Building client for user_id: {user_id}")
    entry = USER_CONNECTIONS.get(user_id)
    if not entry:
        print(f"[CLIENT] No config found for user_id={user_id}")
        print(f"[CLIENT] Available keys: {list(USER_CONNECTIONS.keys())}")
        raise RuntimeError(f"No config found for user_id={user_id}")

    dev_token = entry.get("developer_token")
    refresh_token = entry.get("refresh_token")
    login_customer_id = entry.get("login_customer_id") or ""
    
    print(f"[CLIENT] Has dev_token: {bool(dev_token)}")
    print(f"[CLIENT] Has refresh_token: {bool(refresh_token)}")
    print(f"[CLIENT] Login customer ID: {login_customer_id}")

    if not dev_token or not refresh_token:
        print(f"[CLIENT] Missing tokens - dev_token: {bool(dev_token)}, refresh_token: {bool(refresh_token)}")
        raise RuntimeError(f"Missing developer_token or refresh_token for user_id={user_id}")

    cfg = {
        "developer_token": dev_token,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "use_proto_plus": True,
    }

    if login_customer_id:
        cfg["login_customer_id"] = login_customer_id

    print(f"[CLIENT] Building client with config (tokens masked)")
    client = GoogleAdsClient.load_from_dict(cfg)
    print(f"[CLIENT] Client built successfully")
    return client


def fetch_campaign_metrics_for_range(
    client: GoogleAdsClient,
    customer_id: str,
    date_range: str,
):
    ga_service = client.get_service("GoogleAdsService")
    cust_id_nodash = customer_id.replace("-", "")

    if date_range == "LAST_7_DAYS":
        where_clause = "segments.date DURING LAST_7_DAYS"
    elif date_range == "LAST_30_DAYS":
        where_clause = "segments.date DURING LAST_30_DAYS"
    elif date_range == "LAST_YEAR":
        end = date.today()
        start = end - timedelta(days=365)
        start_str = start.isoformat()
        end_str = end.isoformat()
        where_clause = f"segments.date BETWEEN '{start_str}' AND '{end_str}'"
    else:
        raise ValueError(f"Unsupported date_range: {date_range}")

    query = f"""
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          campaign.advertising_channel_sub_type,
          campaign.bidding_strategy_type,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.average_cpc,
          metrics.interactions,
          metrics.interaction_rate,
          metrics.conversions,
          metrics.all_conversions,
          metrics.conversions_value,
          metrics.conversions_from_interactions_rate,
          metrics.search_impression_share,
          metrics.search_budget_lost_impression_share,
          metrics.search_rank_lost_impression_share
        FROM campaign
        WHERE {where_clause}
        LIMIT 100
    """

    response = ga_service.search(customer_id=cust_id_nodash, query=query)

    campaigns = []
    for row in response:
        c = row.campaign
        m = row.metrics

        campaigns.append({
            "id": c.id,
            "name": c.name,
            "status": c.status.name,
            "channel": c.advertising_channel_type.name,
            "sub_channel": c.advertising_channel_sub_type.name,
            "bidding_strategy_type": c.bidding_strategy_type.name,
            "impressions": m.impressions,
            "clicks": m.clicks,
            "ctr": m.ctr,
            "cost_micros": m.cost_micros,
            "average_cpc": m.average_cpc,
            "interactions": m.interactions,
            "interaction_rate": m.interaction_rate,
            "conversions": m.conversions,
            "all_conversions": m.all_conversions,
            "conversions_value": m.conversions_value,
            "conversions_from_interactions_rate": m.conversions_from_interactions_rate,
            "search_impression_share": m.search_impression_share,
            "search_budget_lost_impression_share": m.search_budget_lost_impression_share,
            "search_rank_lost_impression_share": m.search_rank_lost_impression_share,
        })
    return campaigns


@app.get("/google-ads/accounts")
async def list_accessible_accounts(user_id: str):
    try:
        client = build_google_ads_client_for_user(user_id)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    customer_service = client.get_service("CustomerService")
    try:
        res = customer_service.list_accessible_customers()
    except Exception as e:
        return JSONResponse({"error": f"Google Ads API error: {str(e)}"}, status_code=400)

    ids = [name.split("/")[-1] for name in res.resource_names]
    return JSONResponse({"customer_ids": ids})


@app.get("/google-ads/performance")
async def google_ads_performance(user_id: str, customer_id: str):
    print(f"[PERFORMANCE] Request for user_id: {user_id}, customer_id: {customer_id}")
    print(f"[PERFORMANCE] Available USER_CONNECTIONS keys: {list(USER_CONNECTIONS.keys())}")
    
    # Try to find user by email first (main app users), then by user_id
    storage_key = None
    for key in USER_CONNECTIONS.keys():
        if '@' in key and key == user_id:  # Email match
            storage_key = key
            break
        elif USER_CONNECTIONS[key].get('username') == user_id:  # Username match
            storage_key = key
            break
    
    if not storage_key:
        storage_key = user_id  # Fallback to direct lookup
    
    print(f"[PERFORMANCE] Using storage_key: {storage_key}")
    
    try:
        client = build_google_ads_client_for_user(storage_key)
        print(f"[PERFORMANCE] Successfully built client for {storage_key}")
    except Exception as e:
        print(f"[PERFORMANCE] Failed to build client for {storage_key}: {str(e)}")
        return JSONResponse({"error": str(e)}, status_code=400)

    try:
        print(f"[PERFORMANCE] Fetching campaign data...")
        last_week = fetch_campaign_metrics_for_range(client, customer_id, "LAST_7_DAYS")
        last_month = fetch_campaign_metrics_for_range(client, customer_id, "LAST_30_DAYS")
        last_year = fetch_campaign_metrics_for_range(client, customer_id, "LAST_YEAR")
        print(f"[PERFORMANCE] Successfully fetched data: {len(last_week)} campaigns in last week")
    except Exception as e:
        print(f"[PERFORMANCE] Google Ads API error: {str(e)}")
        return JSONResponse({"error": f"Google Ads API error: {str(e)}"}, status_code=400)

    return JSONResponse({
        "customer_id": customer_id,
        "last_week": last_week,
        "last_month": last_month,
        "last_year": last_year,
    })

@app.post("/api/contact")
async def submit_contact_form(form: ContactForm):
    """Handle contact form submission"""
    try:
        
        msg.attach(MIMEText(body, 'plain'))
        
        contact_file = pathlib.Path(__file__).parent / "contact_submissions.txt"
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        submission = f"{'='*60}\nTIMESTAMP: {timestamp}\nNAME: {form.name}\nEMAIL: {form.email}\nSUBJECT: {form.subject}\nMESSAGE:\n{form.message}\n{'='*60}\n\n"
        with open(contact_file, "a", encoding="utf-8") as f:
            f.write(submission)
        print(f"📧 Contact form saved: {form.name} ({form.email})")
        return JSONResponse({"status": "ok", "message": "Message received"})
    except Exception as e:
        print(f"❌ Error: {e}")
        return JSONResponse({"status": "ok", "message": "Message received"})

@app.get("/google-ads/metric-trend")
async def get_ads_metric_trend(user_id: str, customer_id: str, campaign_id: int, metric_name: str):
    """Get daily trend data for a specific Google Ads metric"""
    try:
        client = build_google_ads_client_for_user(user_id)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)
    
    try:
        ga_service = client.get_service("GoogleAdsService")
        cust_id_nodash = customer_id.replace("-", "")
        
        # Get last 30 days of data
        end = date.today()
        start = end - timedelta(days=30)
        
        query = f"""
            SELECT
              segments.date,
              metrics.impressions,
              metrics.clicks,
              metrics.ctr,
              metrics.cost_micros,
              metrics.average_cpc,
              metrics.conversions,
              metrics.conversions_value
            FROM campaign
            WHERE campaign.id = {campaign_id}
              AND segments.date BETWEEN '{start.isoformat()}' AND '{end.isoformat()}'
            ORDER BY segments.date ASC
        """
        
        response = ga_service.search(customer_id=cust_id_nodash, query=query)
        
        daily_data = []
        for row in response:
            date_str = row.segments.date
            m = row.metrics
            
            # Get the value based on metric_name
            if metric_name == "impressions":
                value = m.impressions
            elif metric_name == "clicks":
                value = m.clicks
            elif metric_name == "ctr":
                value = round(m.ctr * 100, 2)  # Convert to percentage
            elif metric_name == "cost":
                value = round(m.cost_micros / 1000000, 2)  # Convert to dollars
            elif metric_name == "average_cpc":
                value = round(m.average_cpc, 2)
            elif metric_name == "conversions":
                value = round(m.conversions, 2)
            elif metric_name == "conversions_value":
                value = round(m.conversions_value, 2)
            else:
                value = 0
            
            daily_data.append({
                "date": date_str,
                "value": value
            })
        
        return JSONResponse({
            "metric_name": metric_name,
            "campaign_id": campaign_id,
            "data": daily_data
        })
        
    except Exception as e:
        print(f"❌ Error fetching metric trend: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {"error": f"Google Ads API error: {str(e)}"},
            status_code=400
        )


# =======================
# GEMINI AI INTEGRATION
# =======================
import google.generativeai as genai
from fastapi import UploadFile, File
import numpy as np
from setup_agent import setup_agent_chat, SETUP_STATE

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

user_policies = {}
user_vector_stores = {}

def create_vector_store_from_text(policy_text: str):
    chunks = [policy_text[i:i+500] for i in range(0, len(policy_text), 450)]
    embeddings = []
    for chunk in chunks:
        result = genai.embed_content(model="models/text-embedding-004", content=chunk)
        embeddings.append(result['embedding'])
    return {"chunks": chunks, "embeddings": embeddings}

def similarity_search(vector_store, query, k=3):
    query_result = genai.embed_content(model="models/text-embedding-004", content=query)
    query_embedding = query_result['embedding']
    scores = []
    for emb in vector_store["embeddings"]:
        similarity = np.dot(query_embedding, emb) / (np.linalg.norm(query_embedding) * np.linalg.norm(emb))
        scores.append(similarity)
    top_indices = np.argsort(scores)[-k:][::-1]
    return [vector_store["chunks"][i] for i in top_indices]

@app.post("/api/upload-policy")
async def upload_policy(user_id: str, file: UploadFile = File(...)):
    try:
        content = await file.read()
        policy_text = content.decode('utf-8')
        if not policy_text.strip():
            return JSONResponse({"error": "Policy file is empty"}, status_code=400)
        user_policies[user_id] = policy_text
        try:
            user_vector_stores[user_id] = create_vector_store_from_text(policy_text)
        except:
            pass
        return JSONResponse({"status": "success", "message": "Policy uploaded", "filename": file.filename})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/policy-status")
async def get_policy_status(user_id: str):
    return JSONResponse({"has_policy": user_id in user_vector_stores, "user_id": user_id})

class CampaignCreationRequest(BaseModel):
    user_id: str
    customer_id: str
    user_query: str
    landing_url: Optional[str] = None
    use_company_policy: bool = False

@app.post("/api/create-campaign")
async def create_campaign(request: CampaignCreationRequest):
    if not GEMINI_API_KEY:
        return JSONResponse({"error": "Gemini API not configured"}, status_code=503)
    
    try:
        policy_context = ""
        if request.use_company_policy and request.user_id in user_vector_stores:
            try:
                chunks = similarity_search(user_vector_stores[request.user_id], request.user_query, k=3)
                policy_context = "\n\nCompany Policy:\n" + "\n".join(chunks)
            except:
                pass
        
        prompt = f"""Generate a Google Ads Search campaign specification as JSON.

User Query: {request.user_query}
Landing URL: {request.landing_url or "https://example.com"}{policy_context}

Output JSON schema:
{{
  "campaign_name": "string (max 255 chars)",
  "budget_amount_micros": integer (e.g., 10000000 = $10/day),
  "ad_group_name": "string (max 255 chars)",
  "headlines": ["string (max 30 chars)", ...] (3-15 unique),
  "descriptions": ["string (max 90 chars)", ...] (2-4 unique),
  "final_url": "https://... (HTTPS required)",
  "keywords": [{{"text": "keyword", "match_type": "EXACT|PHRASE|BROAD"}}, ...] (1-20),
  "bidding_strategy": "MAXIMIZE_CLICKS|MAXIMIZE_CONVERSIONS|TARGET_CPA|MANUAL_CPC"
}}

CRITICAL RULES:
- Each headline MUST be ≤30 characters (count carefully)
- Each description MUST be ≤90 characters (count carefully)
- All headlines must be unique
- All descriptions must be unique
- final_url must start with https://
- Each keyword must have match_type: EXACT, PHRASE, or BROAD

Return ONLY valid JSON. No markdown, no explanations."""

        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        
        import json, re
        response_text = re.sub(r'```json\s*|\s*```', '', response.text.strip())
        campaign_spec = json.loads(response_text)
        
        # Truncate if AI still exceeds limits
        campaign_spec["headlines"] = [str(h)[:30] for h in campaign_spec.get("headlines", [])][:15]
        campaign_spec["descriptions"] = [str(d)[:90] for d in campaign_spec.get("descriptions", [])][:4]
        campaign_spec["campaign_name"] = str(campaign_spec.get("campaign_name", "Campaign"))[:255]
        
        from campaign_validator import validate_campaign_spec, normalize_keywords
        campaign_spec["keywords"] = normalize_keywords(campaign_spec.get("keywords", []))
        validate_campaign_spec(campaign_spec)
        
        import uuid
        campaign_spec["idempotency_key"] = str(uuid.uuid4())
        campaign_spec["created_at"] = datetime.utcnow().isoformat()
        
        return JSONResponse({
            "status": "success",
            "campaign_spec": campaign_spec,
            "preview": {
                "campaign_name": campaign_spec["campaign_name"],
                "budget": f"${campaign_spec['budget_amount_micros'] / 1000000:.2f}/day",
                "headlines_count": len(campaign_spec["headlines"]),
                "descriptions_count": len(campaign_spec["descriptions"]),
                "keywords_count": len(campaign_spec["keywords"])
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)



@app.post("/api/submit-campaign")
async def submit_campaign_to_google_ads(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    customer_id = body.get("customer_id")
    campaign_spec = body.get("campaign_spec")
    validate_only = body.get("validate_only", False)
    
    if not all([user_id, customer_id, campaign_spec]):
        return JSONResponse({"error": "Missing required fields"}, status_code=400)
    
    try:
        from campaign_validator import validate_campaign_spec, normalize_keywords
        campaign_spec["keywords"] = normalize_keywords(campaign_spec.get("keywords", []))
        validate_campaign_spec(campaign_spec)
    except Exception as e:
        return JSONResponse({"error": f"Validation failed: {str(e)}"}, status_code=400)
    
    try:
        from google.ads.googleads.errors import GoogleAdsException
        import uuid
        
        client = build_google_ads_client_for_user(user_id)
        cust_id_nodash = customer_id.replace("-", "")
        unique_suffix = str(uuid.uuid4())[:8]
        
        bidding_strategy = campaign_spec.get("bidding_strategy", "MANUAL_CPC").upper()
        
        # 1. Campaign Budget
        campaign_budget_service = client.get_service("CampaignBudgetService")
        budget_op = client.get_type("CampaignBudgetOperation")
        budget_op.create.name = f"{campaign_spec['campaign_name'][:200]} Budget {unique_suffix}"
        budget_op.create.amount_micros = int(campaign_spec["budget_amount_micros"])
        budget_op.create.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD
        
        budget_response = campaign_budget_service.mutate_campaign_budgets(
            customer_id=cust_id_nodash, operations=[budget_op], validate_only=validate_only
        )
        if validate_only:
            return JSONResponse({"status": "validated", "message": "Campaign structure is valid"})
        
        budget_resource_name = budget_response.results[0].resource_name
        
        # 2. Campaign
        campaign_service = client.get_service("CampaignService")
        campaign_op = client.get_type("CampaignOperation")
        campaign = campaign_op.create
        campaign.name = campaign_spec["campaign_name"][:255]
        campaign.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
        campaign.status = client.enums.CampaignStatusEnum.PAUSED
        campaign.campaign_budget = budget_resource_name
        campaign.network_settings.target_google_search = True
        campaign.network_settings.target_search_network = True
        campaign.network_settings.target_content_network = False
        campaign.network_settings.target_partner_search_network = False
        
        if bidding_strategy == "MAXIMIZE_CLICKS":
            campaign.maximize_clicks._pb.CopyFrom(client.get_type("MaximizeClicks")._pb)
        elif bidding_strategy == "MAXIMIZE_CONVERSIONS":
            campaign.maximize_conversions._pb.CopyFrom(client.get_type("MaximizeConversions")._pb)
        elif bidding_strategy == "TARGET_CPA":
            target_cpa = client.get_type("TargetCpa")
            target_cpa.target_cpa_micros = 5000000
            campaign.target_cpa._pb.CopyFrom(target_cpa._pb)
        else:
            campaign.manual_cpc._pb.CopyFrom(client.get_type("ManualCpc")._pb)
        
        campaign_response = campaign_service.mutate_campaigns(customer_id=cust_id_nodash, operations=[campaign_op])
        campaign_resource_name = campaign_response.results[0].resource_name
        campaign_id = campaign_resource_name.split("/")[-1]
        
        # 3. Ad Group
        ad_group_service = client.get_service("AdGroupService")
        ad_group_op = client.get_type("AdGroupOperation")
        ad_group = ad_group_op.create
        ad_group.name = campaign_spec.get("ad_group_name", f"Ad Group {unique_suffix}")[:255]
        ad_group.campaign = campaign_resource_name
        ad_group.type_ = client.enums.AdGroupTypeEnum.SEARCH_STANDARD
        ad_group.status = client.enums.AdGroupStatusEnum.PAUSED
        ad_group.cpc_bid_micros = 1000000
        
        ad_group_response = ad_group_service.mutate_ad_groups(customer_id=cust_id_nodash, operations=[ad_group_op])
        ad_group_resource_name = ad_group_response.results[0].resource_name
        
        # 4. Keywords
        criterion_service = client.get_service("AdGroupCriterionService")
        keyword_ops = []
        for kw in campaign_spec["keywords"][:20]:
            op = client.get_type("AdGroupCriterionOperation")
            criterion = op.create
            criterion.ad_group = ad_group_resource_name
            criterion.status = client.enums.AdGroupCriterionStatusEnum.PAUSED
            criterion.keyword.text = kw["text"][:80]
            match_type_map = {
                "EXACT": client.enums.KeywordMatchTypeEnum.EXACT,
                "PHRASE": client.enums.KeywordMatchTypeEnum.PHRASE,
                "BROAD": client.enums.KeywordMatchTypeEnum.BROAD
            }
            criterion.keyword.match_type = match_type_map.get(kw["match_type"], client.enums.KeywordMatchTypeEnum.BROAD)
            keyword_ops.append(op)
        
        if keyword_ops:
            criterion_service.mutate_ad_group_criteria(customer_id=cust_id_nodash, operations=keyword_ops)
        
        # 5. Responsive Search Ad
        ad_service = client.get_service("AdGroupAdService")
        ad_op = client.get_type("AdGroupAdOperation")
        ad_group_ad = ad_op.create
        ad_group_ad.ad_group = ad_group_resource_name
        ad_group_ad.status = client.enums.AdGroupAdStatusEnum.PAUSED
        ad_group_ad.ad.final_urls.append(campaign_spec["final_url"])
        
        rsa = ad_group_ad.ad.responsive_search_ad
        for headline in campaign_spec["headlines"][:15]:
            asset = client.get_type("AdTextAsset")
            asset.text = str(headline)[:30]
            rsa.headlines.append(asset)
        
        for desc in campaign_spec["descriptions"][:4]:
            asset = client.get_type("AdTextAsset")
            asset.text = str(desc)[:90]
            rsa.descriptions.append(asset)
        
        ad_service.mutate_ad_group_ads(customer_id=cust_id_nodash, operations=[ad_op])
        
        return JSONResponse({"status": "success", "message": "Campaign created", "campaign_id": campaign_id})
        
    except GoogleAdsException as ex:
        error_details = []
        for error in ex.failure.errors:
            field_path = " > ".join([f.field_name for f in error.location.field_path_elements]) if error.location else "unknown"
            error_details.append({
                "field": field_path,
                "message": error.message,
                "error_code": error.error_code
            })
        print(f"❌ GoogleAdsException: {error_details}")
        return JSONResponse({"error": "Google Ads API error", "details": error_details}, status_code=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/setup-chat")
async def setup_chat_endpoint(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    message = body.get("message")
    session_data = body.get("session_data", {})
    
    if not user_id or not message:
        return JSONResponse({"error": "Missing user_id or message"}, status_code=400)
    
    try:
        result = await setup_agent_chat(user_id, message, session_data)
        return JSONResponse(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)

@app.get("/api/get-user-email")
async def get_user_email(username: str):
    """Get email for a username by looking through stored user connections"""
    for key, data in USER_CONNECTIONS.items():
        if data.get("username") == username:
            return JSONResponse({"email": key if "@" in key else data.get("email")})
    
    return JSONResponse({"error": "User not found"}, status_code=404)

@app.get("/api/debug-users")
async def debug_users():
    """Debug endpoint to see what users are stored"""
    return JSONResponse({
        "stored_users": list(USER_CONNECTIONS.keys()),
        "user_data": {k: {"has_tokens": bool(v.get("refresh_token")), "has_dev_token": bool(v.get("developer_token")), "email": v.get("email"), "username": v.get("username")} for k, v in USER_CONNECTIONS.items()}
    })

@app.post("/api/store-setup")
async def store_setup(request: Request):
    body = await request.json()
    user_email = body.get("user_email")
    developer_token = body.get("developer_token")
    manager_id = body.get("manager_id")
    customer_id = body.get("customer_id")
    username = body.get("username")
    tokens = body.get("tokens", {})
    
    if not all([user_email, developer_token, manager_id, customer_id]):
        return JSONResponse({"error": "Missing required fields"}, status_code=400)
    
    try:
        # Get existing entry or create new one
        entry = USER_CONNECTIONS.get(user_email, {})
        
        # Update with setup data
        entry["developer_token"] = developer_token
        entry["login_customer_id"] = manager_id
        entry["customer_id"] = customer_id
        entry["username"] = username
        entry["email"] = user_email
        
        # Store OAuth tokens if available
        if tokens.get("access_token"):
            entry["access_token"] = tokens["access_token"]
        if tokens.get("refresh_token"):
            entry["refresh_token"] = tokens["refresh_token"]
        
        # Store using email as primary key
        USER_CONNECTIONS[user_email] = entry
        
        # ALSO store using username as secondary key for lookup
        if username:
            USER_CONNECTIONS[username] = entry
        
        print(f"[STORE_SETUP] Stored setup data for {user_email} and {username}")
        print(f"[STORE_SETUP] Data: dev_token={bool(developer_token)}, manager_id={manager_id}, customer_id={customer_id}")
        print(f"[STORE_SETUP] Tokens: access={bool(tokens.get('access_token'))}, refresh={bool(tokens.get('refresh_token'))}")
        
        return JSONResponse({"status": "success"})
        
    except Exception as e:
        print(f"[STORE_SETUP] Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/complete-setup")
async def complete_setup(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    data = body.get("data")
    user_email = body.get("user_email")
    tokens = body.get("tokens")
    
    if not user_id or not data or not user_email or not tokens:
        return JSONResponse({"error": "Missing required data"}, status_code=400)
    
    try:
        # Store the complete setup data with OAuth tokens
        storage_key = user_email
        
        entry = {
            "refresh_token": tokens.get("refresh_token"),
            "access_token": tokens.get("access_token"),
            "email": user_email,
            "developer_token": data["developer_token"],
            "login_customer_id": data["manager_id"],
            "customer_id": data["campaign_id"],
            "username": data["username"]
        }
        
        USER_CONNECTIONS[storage_key] = entry
        
        print(f"[SETUP] Stored complete setup for {storage_key}")
        print(f"[SETUP] Has tokens: access={bool(tokens.get('access_token'))}, refresh={bool(tokens.get('refresh_token'))}")
        print(f"[SETUP] Setup data: dev_token={bool(data['developer_token'])}, mcc_id={data['manager_id']}, customer_id={data['campaign_id']}")
        
        return JSONResponse({
            "status": "success",
            "message": "Setup completed successfully",
            "setup_data": data
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
