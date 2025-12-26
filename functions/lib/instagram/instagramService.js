"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInstagramProfile = exports.getInstagramHashtagMedia = exports.getInstagramHashtagId = exports.replyToComment = exports.getPostComments = exports.deleteInstagramMedia = exports.updateInstagramMedia = exports.publishPost = exports.getInstagramRecentMedia = exports.getInstagramFeed = exports.sendInstagramReply = exports.getInstagramMessages = exports.getInstagramConversations = exports.getInstagramProfile = exports.getInstagramBusinessId = exports.getFacebookPages = exports.isSessionExpired = void 0;
const isSessionExpired = (errorMsg) => {
    return !!errorMsg && (errorMsg.includes('Session Expired') || errorMsg.includes('code: 190'));
};
exports.isSessionExpired = isSessionExpired;
const handleInstagramError = (errorObj) => {
    if (!errorObj)
        return "Unknown Error";
    const msg = errorObj.message || JSON.stringify(errorObj);
    const code = errorObj.code;
    const subcode = errorObj.error_subcode;
    // Rate Limiting
    if (code === 17 || code === 32 || code === 613) {
        return "Rate Limit Reached: Please wait 15-30 minutes.";
    }
    // Permissions
    if (code === 3 || code === 10 || code === 200 || msg.includes('permission')) {
        return "Permission Denied: Your token lacks 'instagram_manage_messages' or 'pages_manage_metadata'.";
    }
    // Session Expired
    if (code === 190) {
        return "Session Expired: Please generate a new User Access Token.";
    }
    return `Instagram API Error (${code}): ${msg}`;
};
/**
 * ID DISCOVERY HELPERS
 */
const getFacebookPages = async (accessToken) => {
    try {
        const url = `https://graph.facebook.com/v19.0/me/accounts?fields=name,id,access_token,category&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { pages: data.data || [] };
    }
    catch (e) {
        return { error: e.message };
    }
};
exports.getFacebookPages = getFacebookPages;
const getInstagramBusinessId = async (accessToken, pageId) => {
    try {
        const url = `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { igId: data.instagram_business_account?.id };
    }
    catch (e) {
        return { error: e.message };
    }
};
exports.getInstagramBusinessId = getInstagramBusinessId;
/**
 * CORE INSTAGRAM SERVICES
 */
const getInstagramProfile = async (accessToken, businessId) => {
    const token = accessToken?.trim();
    const bId = businessId?.trim();
    if (!token || !bId)
        return { error: "Missing configuration" };
    try {
        const fields = 'name,username,profile_picture_url,followers_count,media_count,biography,website';
        const url = `https://graph.facebook.com/v19.0/${bId}?fields=${fields}&access_token=${token}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { profile: data };
    }
    catch (error) {
        return { error: "Network error. Check connection." };
    }
};
exports.getInstagramProfile = getInstagramProfile;
const getInstagramConversations = async (accessToken, businessId) => {
    const token = accessToken?.trim();
    if (!token)
        return { error: "Missing access token" };
    try {
        // Using graph.instagram.com endpoint for user token authentication
        const url = `https://graph.instagram.com/v22.0/me/conversations?platform=instagram&fields=participants,messages{created_time,from,message}&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { threads: data.data || [] };
    }
    catch (e) {
        return { error: e.message };
    }
};
exports.getInstagramConversations = getInstagramConversations;
const getInstagramMessages = async (accessToken, threadId) => {
    const token = accessToken?.trim();
    if (!token)
        return { error: "Missing token" };
    try {
        // Using graph.instagram.com endpoint for user token authentication
        const fields = 'created_time,from,message';
        const url = `https://graph.instagram.com/v22.0/${threadId}/messages?fields=${fields}&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { messages: data.data || [] };
    }
    catch (e) {
        return { error: e.message };
    }
};
exports.getInstagramMessages = getInstagramMessages;
const sendInstagramReply = async (accessToken, businessId, recipientId, message) => {
    const token = accessToken?.trim();
    const bId = businessId?.trim();
    if (!token || !bId)
        return { success: false, error: "Missing configuration" };
    try {
        const url = `https://graph.facebook.com/v19.0/${bId}/messages?access_token=${token}`;
        const body = {
            recipient: { id: recipientId },
            message: { text: message }
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.error)
            return { success: false, error: handleInstagramError(data.error) };
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
};
exports.sendInstagramReply = sendInstagramReply;
/**
 * FEED & CONTENT SERVICES
 */
const getInstagramFeed = async (accessToken, businessId) => {
    const token = accessToken?.trim();
    const bId = businessId?.trim();
    if (!token || !bId)
        return { error: "Missing configuration" };
    try {
        const fields = 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink,is_comment_enabled';
        const url = `https://graph.facebook.com/v19.0/${bId}/media?fields=${fields}&limit=20&access_token=${token}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { media: data.data || [] };
    }
    catch (e) {
        return { error: e.message };
    }
};
exports.getInstagramFeed = getInstagramFeed;
const getInstagramRecentMedia = async (accessToken, businessId) => {
    const token = accessToken?.trim();
    const bId = businessId?.trim();
    if (!token || !bId)
        return { error: "Missing configuration" };
    try {
        const fields = 'id,caption,media_type,media_url,timestamp,like_count,comments_count,permalink,is_comment_enabled';
        const url = `https://graph.facebook.com/v19.0/${bId}/media?fields=${fields}&limit=5&access_token=${token}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { media: data.data || [] };
    }
    catch (e) {
        return { error: e.message };
    }
};
exports.getInstagramRecentMedia = getInstagramRecentMedia;
const publishPost = async (accessToken, businessId, imageUrl, caption) => {
    const token = accessToken?.trim();
    const bId = businessId?.trim();
    if (!token || !bId)
        return { success: false, error: "Missing Instagram configuration" };
    if (imageUrl.startsWith('data:')) {
        return { success: true, id: 'mock_id_' + Date.now(), error: "SIMULATION_MODE" };
    }
    try {
        const containerUrl = `https://graph.facebook.com/v19.0/${bId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${token}`;
        const containerRes = await fetch(containerUrl, { method: 'POST' });
        const containerData = await containerRes.json();
        if (containerData.error)
            return { success: false, error: handleInstagramError(containerData.error) };
        const publishUrl = `https://graph.facebook.com/v19.0/${bId}/media_publish?creation_id=${containerData.id}&access_token=${token}`;
        const publishRes = await fetch(publishUrl, { method: 'POST' });
        const publishData = await publishRes.json();
        if (publishData.error)
            return { success: false, error: handleInstagramError(publishData.error) };
        return { success: true, id: publishData.id };
    }
    catch (e) {
        return { success: false, error: e.message || "Network error" };
    }
};
exports.publishPost = publishPost;
const updateInstagramMedia = async (accessToken, mediaId, caption, commentEnabled = true) => {
    const token = accessToken?.trim();
    if (!token || !mediaId)
        return { success: false, error: "Missing config" };
    try {
        const url = `https://graph.facebook.com/v19.0/${mediaId}?access_token=${token}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caption, comment_enabled: commentEnabled })
        });
        const data = await res.json();
        if (data.error)
            return { success: false, error: handleInstagramError(data.error) };
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
};
exports.updateInstagramMedia = updateInstagramMedia;
const deleteInstagramMedia = async (accessToken, mediaId) => {
    const token = accessToken?.trim();
    if (!token || !mediaId)
        return { success: false, error: "Missing configuration" };
    if (mediaId.startsWith('mock_'))
        return { success: true };
    try {
        const url = `https://graph.facebook.com/v19.0/${mediaId}?access_token=${token}`;
        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json();
        if (data.error)
            return { success: false, error: handleInstagramError(data.error) };
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
};
exports.deleteInstagramMedia = deleteInstagramMedia;
const getPostComments = async (accessToken, mediaId) => {
    const token = accessToken?.trim();
    if (!token || !mediaId)
        return { error: "Missing config" };
    try {
        const fields = 'id,text,username,timestamp,from';
        const url = `https://graph.facebook.com/v19.0/${mediaId}/comments?fields=${fields}&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { comments: data.data || [] };
    }
    catch (e) {
        return { error: e.message };
    }
};
exports.getPostComments = getPostComments;
const replyToComment = async (accessToken, commentId, message) => {
    const token = accessToken?.trim();
    if (!token || !commentId)
        return { success: false, error: "Missing config" };
    try {
        const url = `https://graph.facebook.com/v19.0/${commentId}/replies?access_token=${token}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        if (data.error)
            return { success: false, error: handleInstagramError(data.error) };
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
};
exports.replyToComment = replyToComment;
const getInstagramHashtagId = async (accessToken, businessId, hashtag) => {
    const token = accessToken?.trim();
    const bId = businessId?.trim();
    if (!token || !bId)
        return { error: "Missing configuration" };
    try {
        const url = `https://graph.facebook.com/v19.0/ig_hashtag_search?user_id=${bId}&q=${hashtag.replace('#', '')}&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { id: data.data?.[0]?.id };
    }
    catch (e) {
        return { error: "Connection error: " + e.message };
    }
};
exports.getInstagramHashtagId = getInstagramHashtagId;
const getInstagramHashtagMedia = async (accessToken, businessId, hashtagId, type = 'top_media') => {
    const token = accessToken?.trim();
    const bId = businessId?.trim();
    if (!token || !bId || !hashtagId)
        return { error: "Missing configuration" };
    try {
        const fields = 'id,caption,media_type,media_url,permalink,timestamp';
        const url = `https://graph.facebook.com/v19.0/${hashtagId}/${type}?user_id=${bId}&fields=${fields}&limit=5&access_token=${token}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.error)
            return { error: handleInstagramError(data.error) };
        return { media: data.data || [] };
    }
    catch (e) {
        return { error: "Connection error: " + e.message };
    }
};
exports.getInstagramHashtagMedia = getInstagramHashtagMedia;
const updateInstagramProfile = async (accessToken, businessId, profileData) => {
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1500));
};
exports.updateInstagramProfile = updateInstagramProfile;
