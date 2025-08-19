# AI Legal Document Explainer - Complete Setup Guide

A full-featured AI-powered legal document analysis tool that provides instant summaries, risk analysis, and interactive chat functionality.

## 🚀 Features

- **📄 PDF Upload & Processing**: Upload legal PDFs instantly
- **📝 Smart Summarization**: AI-powered document summaries in plain English
- **🔎 Detailed Analysis**: Key clauses, obligations, and unusual terms
- **⚠️ Risk Assessment**: Identifies penalties, auto-renewals, and one-sided terms
- **💬 Interactive Chat**: Ask questions directly about your document
- **🎨 Modern UI**: Clean, responsive interface with tabbed navigation

## 🛠️ Tech Stack

- **Frontend**: React.js with Tailwind CSS (deployed on Vercel)
- **Backend**: FastAPI with Python (deployed on Railway)
- **AI**: Google Gemini 2.5 Flash
- **File Processing**: PyPDF2 for PDF text extraction

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Google Gemini API key
- Git

## 📁 Project Structure Setup

### File Structure

```bash
ai-legal-document-explainer/
├── backend/
│   ├── main.py
│   ├── requirement.txt
│   ├── Dockerfile
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js
    |   ├── index.css
    │   └── index.js
    ├── public/
    │   └── index.html
    ├── package.json
    ├── vercel.json
    └── .env
```

### 🚀 Project Setup

#### 🐍 Backend Setup (Python/FastAPI)

##### 1. Navigate to backend folder and create virtual environment:
```bash
# Clone or create backend directory
mkdir ai-legal-backend
cd ai-legal-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate  
# On Windows: 
venv\Scripts\activate
```

##### 2. Install Python dependencies:
```bash
pip install fastapi==0.104.1
pip install uvicorn==0.24.0
pip install python-multipart==0.0.6
pip install google-generativeai==0.3.2
pip install PyPDF2==3.0.1
pip install pydantic==2.5.0
pip install python-dotenv==1.0.0

# Or install from requirements.txt:
pip install -r requirements.txt
```
##### 3. Create .env file in backend folder:
```bash
# Create .env file
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
```
##### 4. Test backend:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### ⚛️ Frontend Setup (React)

##### 1. Navigate to frontend folder and initialize React app:
```bash
cd ../frontend

# Initialize npm project (if package.json doesn't exist)
npm init -y
```

##### 2. Install additional dependencies
```bash
# Install React and core dependencies
npm install react@^18.2.0
npm install react-dom@^18.2.0
npm install react-scripts@5.0.1

# Install additional dependencies
npm install lucide-react@^0.263.1

# Install development dependencies
npm install --save-dev @testing-library/jest-dom@^5.17.0
npm install --save-dev @testing-library/react@^13.4.0
npm install --save-dev @testing-library/user-event@^13.5.0
npm install --save-dev web-vitals@^2.1.4
```
##### 3. Create required files:
```bash
#Check if these files are there:
     public/index.html
     src/index.js
     frontend/package.json
```

##### 4. Create .env file in frontend folder:
```bash
# Create .env file
echo REACT_APP_API_URL=http://localhost:8000 > .env
```
##### 5. Start the frontend:
```bash
# Start development server
npm start
```
#### 🔑 Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key (you'll need it for deployment)
4. Replace [your_actual_gemini_api_key_here] in your backend [.env] file

#### 🔧 Running the Application
##### Open 2 terminals:
###### Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
###### Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

#### 🔍 Troubleshooting

##### Code Errors:

###### If you get Python errors:
```bash
# Make sure Python is installed
python --version

# If you get ModuleNotFoundError, reinstall:
pip install --upgrade pip
pip install -r requirements.txt
```
###### If you get Node.js errors:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```
##### Common Issues:

1. **PDF Upload Fails**:
   - Check file size (< 10MB recommended)
   - Ensure PDF contains extractable text
   - Verify CORS settings

2. **AI Analysis Fails**:
   - Verify Gemini API key is correct
   - Check API quota limits
   - Ensure document text is not empty

3. **Chat Not Working**:
   - Verify backend connection
   - Check browser console for errors
   - Ensure document was successfully processed

##### Debugging:

```bash
# Backend logs
railway logs  # On Railway

# Frontend logs
# Check browser developer console

# Local testing
curl http://localhost:8000/health
```

## 🚂 Railway Deployment (Backend)

### Option 1: Deploy from GitHub
1. **Push your backend code to GitHub**:
```bash
git init
git add .
git commit -m "Initial backend commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```
2. **Deploy on Railway**:
   - Go to [Railway](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your backend repository
   - Add environment variable: `GEMINI_API_KEY=your_actual_api_key`
   - Railway will automatically detect the Dockerfile and deploy

### Option 2: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link  # Link to existing project or create new
railway up    # Deploy

# Add environment variable
railway variables set GEMINI_API_KEY=your_actual_api_key
```

## 📦 Vercel Deployment (Frontend)

### Option 1: Deploy from GitHub
1. **Push frontend to GitHub**:
```bash
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin YOUR_FRONTEND_REPO_URL
git push -u origin main
```
2. **Deploy on Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your frontend repository
   - Add environment variable: `REACT_APP_API_URL=https://your-railway-backend-url.railway.app`
   - Deploy

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variable
vercel env add REACT_APP_API_URL production
# Enter: https://your-railway-backend-url.railway.app
```

## 🔧 Configuration
### Backend Environment Variables
```bash
env
GEMINI_API_KEY=your_gemini_api_key_here
```
### Frontend Environment Variables

```bash
env
# For local development
REACT_APP_API_URL=http://localhost:8000

# For production
REACT_APP_API_URL=https://your-railway-backend-url.railway.app
```

## 📱 Usage

1. **Upload Document**: Click the upload area and select a PDF file
2. **View Analysis**: Browse through Summary, Key Clauses, Obligations, and Risks tabs
3. **Chat Interface**: Ask questions about specific parts of the document
4. **Risk Assessment**: Review highlighted risks and unusual terms

### Example Questions to Ask:

- "What are the termination conditions?"
- "Are there any auto-renewal clauses?"
- "What penalties or fees are mentioned?"
- "Who is responsible for what in this contract?"
- "Are there any unusual or concerning terms?"

## 🛡️ Security Features

- File type validation (PDF only)
- File size limits
- Input sanitization
- CORS protection
- API key security

## 📈 Scaling Considerations

- **Database**: Add PostgreSQL/MongoDB for document storage
- **Authentication**: Implement user accounts and document history
- **Caching**: Add Redis for repeated document analysis
- **File Storage**: Use AWS S3/Google Cloud Storage for large files
- **Rate Limiting**: Implement API rate limiting
- **Monitoring**: Add logging and error tracking

## 🚀 Advanced Features to Add

- **Multi-document comparison**
- **Document version tracking**
- **Email summaries**
- **Integration with legal databases**
- **Advanced risk scoring**
- **Document templates**
- **Team collaboration features**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License.

## 🆘 Support
For issues and questions:
- Create GitHub Issues for bugs
- Check Railway/Vercel documentation for deployment issues
- Review Google AI documentation for API problems
---