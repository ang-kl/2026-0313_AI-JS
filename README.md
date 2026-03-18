# AI Skills Analyser - v5
**Understanding AI's Impact on Your Role**
Built by Adrian K. L. Ang - linkedin.com/in/angadrian

---

## Deploy to Vercel

### Step 1 - Extract this folder
Unzip and place the `ai-job-analyser-v5` folder in your Downloads.

### Step 2 - Open Terminal and navigate to the folder
```
cd ~/Downloads/ai-job-analyser-v5
```

### Step 3 - Install dependencies
```
npm install --legacy-peer-deps
```

### Step 4 - Deploy to Vercel
```
vercel --prod
```
Press Enter for all questions. Vercel CLI should already be installed from your previous deployment.

### Step 5 - Add your Anthropic API key on Vercel
1. Go to vercel.com and open your project
2. Settings > Environment Variables
3. Add: Name = ANTHROPIC_API_KEY, Value = your key
4. Save, then redeploy:
```
vercel --prod
```

---

## Connect a custom domain (optional)
1. Buy your domain at cloudflare.com/products/registrar
2. In Vercel: Project > Settings > Domains
3. Add your domain and follow the DNS instructions
4. Vercel handles HTTPS automatically

---

## Cost estimate
Each full analysis run uses Claude Haiku (~5 API calls).
Approximate cost per analysis: USD 0.02 to 0.04
200 users: ~USD 4 to 8 total
