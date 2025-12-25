import google.generativeai as genai
import json
import re

SETUP_AGENT_API_KEY = "AIzaSyDoAkqBhpRvuHhUEMaIW0-RI_T8Oz8PdOo"
genai.configure(api_key=SETUP_AGENT_API_KEY)

SETUP_STATE = {}

def extract_value(text):
    """Extract meaningful value from user response"""
    text = text.strip()
    patterns = [
        r'(?:my\s+(?:name|username)\s+is\s+)(\w+)',
        r'(?:call\s+me\s+)(\w+)',
        r'(?:i\'m\s+)(\w+)',
        r'^(\w+)$'
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1)
    return text

async def setup_agent_chat(user_id: str, message: str, session_data: dict):
    """Handle conversational setup flow"""
    model = genai.GenerativeModel("gemini-2.0-flash-exp")
    
    # Initialize state only if it doesn't exist
    if user_id not in SETUP_STATE:
        SETUP_STATE[user_id] = {
            "step": "username",
            "data": {},
            "history": []
        }
    
    state = SETUP_STATE[user_id]
    state["history"].append({"role": "user", "content": message})
    
    # Step-based conversation
    if state["step"] == "username":
        username = extract_value(message)
        state["data"]["username"] = username
        state["step"] = "developer_token"
        response = f"Nice to meet you, {username}! 👋\n\nNow, I need your **Google Ads Developer Token**. This is a special key that lets us access your Google Ads data.\n\n**Where to find it:**\n1. Go to Google Ads\n2. Click Tools & Settings → API Center\n3. Copy your Developer Token\n\nPaste it here, or type 'help' if you need more guidance."
        
    elif state["step"] == "developer_token":
        if message.lower() == "help":
            response = "**How to get your Developer Token:**\n\n1. Sign in to Google Ads\n2. Click the tools icon (🔧) in the top right\n3. Under 'Setup', click 'API Center'\n4. You'll see your Developer Token there\n5. Click 'Copy' and paste it here\n\n**Note:** If you don't see it, you may need to request access first. This can take 24-48 hours for approval.\n\nReady to paste your token?"
        else:
            state["data"]["developer_token"] = message.strip()
            state["step"] = "manager_id"
            response = "Great! Token saved. ✅\n\nNext, I need your **Manager Account ID** (also called MCC ID or Login Customer ID).\n\n**What is this?**\nThis is the ID of the Google Ads account that manages your campaigns. If you only have one account, use that account's ID.\n\n**Where to find it:**\nLook at the top right of your Google Ads dashboard - you'll see a number like `123-456-7890`.\n\nType 'help' if you need more info, or paste your Manager ID:"
    
    elif state["step"] == "manager_id":
        if message.lower() == "help":
            response = "**About Manager Account ID:**\n\nThis is the customer ID that has access to your campaigns.\n\n- If you have a **Manager Account (MCC)**: Use that ID\n- If you have a **single account**: Use your account's customer ID\n\n**Where to find it:**\n1. Go to Google Ads\n2. Look at the top right corner\n3. You'll see a number like `123-456-7890`\n4. That's your customer ID!\n\nPaste it here:"
        else:
            state["data"]["manager_id"] = message.strip().replace("-", "")
            state["step"] = "campaign_id"
            response = "Perfect! Manager ID saved. ✅\n\nLast step! I need the **Campaign Account ID** - this is the specific account whose campaigns you want to analyze.\n\n**Important:**\n- This might be the same as your Manager ID (if you only have one account)\n- Or it could be a different account that your Manager Account has access to\n\n**Format:** `123-456-7890`\n\nType 'same' if it's the same as your Manager ID, or paste the Campaign Account ID:"
    
    elif state["step"] == "campaign_id":
        if message.lower() == "same":
            state["data"]["campaign_id"] = state["data"]["manager_id"]
        elif message.lower() == "help":
            response = "**About Campaign Account ID:**\n\nThis is the account that actually runs your ad campaigns.\n\n- If you only have **one Google Ads account**: Type 'same'\n- If your Manager Account manages **multiple accounts**: Paste the specific account ID you want to analyze\n\n**Where to find it:**\n1. Go to Google Ads\n2. If you see multiple accounts, select the one you want\n3. The ID is shown in the top right (format: `123-456-7890`)\n\nType 'same' or paste the ID:"
        else:
            state["data"]["campaign_id"] = message.strip().replace("-", "")
        
        if "campaign_id" in state["data"]:
            state["step"] = "complete"
            response = f"🎉 **Setup Complete!**\n\nHere's what I've collected:\n\n✅ Username: {state['data']['username']}\n✅ Developer Token: {state['data']['developer_token'][:10]}...\n✅ Manager ID: {state['data']['manager_id']}\n✅ Campaign ID: {state['data']['campaign_id']}\n\nI'm now saving this configuration and fetching your campaign data. This may take a moment..."
            return {"response": response, "complete": True, "data": state["data"]}
    
    elif state["step"] == "complete":
        response = "Your setup is already complete! You can now access your dashboard."
        return {"response": response, "complete": True, "data": state["data"]}
    
    state["history"].append({"role": "assistant", "content": response})
    return {"response": response, "complete": False, "data": None}
