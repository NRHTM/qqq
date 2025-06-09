# Cloudflare Worker CORS Proxy Deployment Instructions

## Prerequisites
- Cloudflare account
- Domain configured with Cloudflare (for custom domain routing)

## Deployment Steps

### 1. Create the Worker
1. Log in to your Cloudflare dashboard
2. Go to **Workers & Pages** → **Create application** → **Create Worker**
3. Replace the default code with the `worker.js` code provided
4. The configuration is already set for your domain:
   \`\`\`js
   const MY_DOMAIN = 'testing-az7.pages.dev'; // Your Cloudflare Pages domain
   const BLOCKED_REDIRECT_URL = 'https://www.youtube.com/watch?v=cdG-Y55v-ng'; // YouTube redirect
   \`\`\`

### 2. Configure Custom Domain (Optional but Recommended)
1. In the Worker settings, go to **Triggers** → **Custom Domains**
2. Add a custom domain like `proxy.yourdomain.com`
3. This makes your proxy URL cleaner and more professional

### 3. Test the Worker
1. Deploy the worker
2. Test with a simple GET request:
   \`\`\`
   https://your-worker.workers.dev/https://jsonplaceholder.typicode.com/posts/1
   \`\`\`
3. Verify CORS headers are present in the response

### 4. Security Considerations
- The worker allows all origins (`*`) for CORS, which is intentional for a proxy
- Requests from non-tier-1 countries and non-your-domain origins are allowed
- Consider adding rate limiting if needed
- Monitor usage to prevent abuse

### 5. Usage Examples
- Basic GET: `https://your-worker.workers.dev/https://api.example.com/data`
- With query params: `https://your-worker.workers.dev/https://api.example.com/search?q=test`
- POST/PUT/DELETE: Use the JavaScript examples provided

## Configuration Options

### Country Blocking
Modify the `TIER_1_COUNTRIES` array to change which countries are blocked:
\`\`\`js
const TIER_1_COUNTRIES = ['US', 'CA', 'GB', 'FR', 'DE', 'JP', 'AU', 'NL', 'SE'];
\`\`\`

### Domain Restrictions
Update `MY_DOMAIN` to match your domain:
\`\`\`js
const MY_DOMAIN = 'mydomain.com'; // Allows mydomain.com and *.mydomain.com
\`\`\`

### Redirect URL
Change where blocked users are redirected:
\`\`\`js
const BLOCKED_REDIRECT_URL = 'https://yourdomain.com/access-denied';
\`\`\`

## Monitoring and Debugging
- Use Cloudflare's **Workers** → **Analytics** to monitor usage
- Check the **Logs** tab for debugging information
- Test from different countries using VPN to verify country blocking

## Cost Considerations
- Cloudflare Workers free tier: 100,000 requests/day
- Paid tier: $5/month for 10 million requests
- Monitor usage to avoid unexpected charges
