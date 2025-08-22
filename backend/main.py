from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
from google.generativeai import GenerativeModel
import PyPDF2
import io
import json
from datetime import datetime
from dotenv import load_dotenv
import logging
import traceback
import os
import uvicorn
from mangum import Mangum

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Legal Document Explainer API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
logger.info(f"Gemini API Key configured: {bool(GEMINI_API_KEY)}")

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Gemini API configured successfully")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")
else:
    logger.warning("GEMINI_API_KEY not found in environment variables")

class ChatMessage(BaseModel):
    message: str
    document_id: Optional[str] = None
    document_text: Optional[str] = None

class DocumentAnalysis(BaseModel):
    summary: str
    key_clauses: List[Dict[str, str]]
    obligations: List[Dict[str, str]]
    risks: List[Dict[str, str]]
    unusual_terms: List[Dict[str, str]]

class DocumentResponse(BaseModel):
    document_id: str
    filename: str
    analysis: Dict[str, Any]
    text_length: int

class ChatResponse(BaseModel):
    response: str
    timestamp: str

# Store document context (in production, use a proper database)
document_store: Dict[str, Dict[str, Any]] = {}

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        logger.info("Starting PDF text extraction")
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        logger.info(f"PDF has {len(pdf_reader.pages)} pages")
        
        text = ""
        for i, page in enumerate(pdf_reader.pages):
            try:
                page_text = page.extract_text()
                text += page_text + "\n"
                logger.info(f"Extracted text from page {i+1}: {len(page_text)} characters")
            except Exception as e:
                logger.warning(f"Failed to extract text from page {i+1}: {e}")
                continue
        
        extracted_length = len(text.strip())
        logger.info(f"Total extracted text length: {extracted_length} characters")
        
        if extracted_length == 0:
            raise Exception("No text could be extracted from the PDF. The file might be image-based or corrupted.")
            
        return text.strip()
        
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")

def analyze_document_with_gemini(text: str) -> DocumentAnalysis:
    """Analyze document using Gemini AI"""
    logger.info("Starting document analysis with Gemini")
    
    if not GEMINI_API_KEY:
        logger.error("Gemini API key not configured")
        raise HTTPException(status_code=500, detail="Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.")
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini model initialized")
        
        # Limit text to avoid token limits
        limited_text = text[:25000] if len(text) > 25000 else text
        logger.info(f"Using text of length: {len(limited_text)} characters")
        
        prompt = f"""
        You are a legal document analyzer. Analyze this document and respond with ONLY valid JSON in the exact format specified.

        Document Text:
        {limited_text}

        Respond with valid JSON only (no markdown, no explanations):
        {{
            "summary": "Brief explanation of the document's purpose and main points",
            "key_clauses": [
                {{"clause": "Clause name", "explanation": "Simple explanation", "location": "Section reference"}}
            ],
            "obligations": [
                {{"party": "Who", "obligation": "What they must do", "consequence": "Result of non-compliance"}}
            ],
            "risks": [
                {{"type": "Financial", "description": "Risk description", "severity": "High"}}
            ],
            "unusual_terms": [
                {{"term": "Term name", "explanation": "Why unusual", "recommendation": "What to do"}}
            ]
        }}
        """

        logger.info("Sending request to Gemini API")
        response = model.generate_content(prompt)
        logger.info("Received response from Gemini API")
        
        response_text = response.text.strip()
        logger.info(f"Response text length: {len(response_text)}")
        
        # Clean the response
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        response_text = response_text.strip()
        
        try:
            analysis_data = json.loads(response_text)
            logger.info("Successfully parsed JSON response")
            
            return DocumentAnalysis(
                summary=analysis_data.get("summary", "Document analysis completed."),
                key_clauses=analysis_data.get("key_clauses", []),
                obligations=analysis_data.get("obligations", []),
                risks=analysis_data.get("risks", []),
                unusual_terms=analysis_data.get("unusual_terms", [])
            )
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.error(f"Response text: {response_text[:500]}...")
            
            # Return fallback response
            return DocumentAnalysis(
                summary="The document has been processed. The AI analysis is available through the chat feature.",
                key_clauses=[{"clause": "Document Processed", "explanation": "Use the chat feature to ask about specific clauses", "location": "Throughout document"}],
                obligations=[{"party": "Document parties", "obligation": "Refer to original document", "consequence": "Use chat for specific details"}],
                risks=[{"type": "General", "description": "Use chat to identify specific risks", "severity": "Medium"}],
                unusual_terms=[{"term": "Various", "explanation": "Chat with AI to identify unusual terms", "recommendation": "Review document carefully"}]
            )
        
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Return fallback response instead of raising error
        return DocumentAnalysis(
            summary="Document uploaded successfully. AI analysis encountered an issue, but you can still chat about the document.",
            key_clauses=[{"clause": "Upload Successful", "explanation": "Document processed, use chat for analysis", "location": "N/A"}],
            obligations=[{"party": "User", "obligation": "Use chat feature for detailed analysis", "consequence": "Limited automated analysis"}],
            risks=[{"type": "Technical", "description": "AI analysis partially unavailable", "severity": "Low"}],
            unusual_terms=[{"term": "Processing", "explanation": "Use chat feature for detailed term analysis", "recommendation": "Ask specific questions"}]
        )

@app.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    """Upload and analyze a legal document"""
    logger.info(f"Received file upload: {file.filename}")
    
    try:
        # Validate file
        if not file.filename:
            logger.error("No filename provided")
            raise HTTPException(status_code=400, detail="No file selected")
            
        if not file.filename.lower().endswith('.pdf'):
            logger.error(f"Invalid file type: {file.filename}")
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Check file size
        file_size = 0
        content = await file.read()
        file_size = len(content)
        logger.info(f"File size: {file_size} bytes ({file_size/1024/1024:.2f} MB)")
        
        if file_size == 0:
            logger.error("Empty file uploaded")
            raise HTTPException(status_code=400, detail="The uploaded file is empty")
            
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            logger.error(f"File too large: {file_size} bytes")
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Extract text from PDF
        logger.info("Extracting text from PDF")
        document_text = extract_text_from_pdf(content)
        
        if len(document_text.strip()) < 50:
            logger.error(f"Insufficient text extracted: {len(document_text)} characters")
            raise HTTPException(
                status_code=400, 
                detail="Document appears to contain insufficient text. Please ensure the PDF contains readable text (not just images)."
            )
        
        # Generate document ID
        doc_id = f"doc_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{abs(hash(document_text[:1000])) % 10000}"
        logger.info(f"Generated document ID: {doc_id}")
        
        # Store document text for chat functionality
        document_store[doc_id] = {
            "text": document_text,
            "filename": file.filename,
            "upload_time": datetime.now().isoformat(),
            "file_size": file_size
        }
        logger.info(f"Stored document in memory. Total documents: {len(document_store)}")
        
        # Analyze document
        logger.info("Starting document analysis")
        analysis = analyze_document_with_gemini(document_text)
        logger.info("Document analysis completed")
        
        result = {
            "document_id": doc_id,
            "filename": file.filename,
            "analysis": analysis.dict(),
            "text_length": len(document_text)
        }
        
        logger.info(f"Upload successful: {file.filename} ({len(document_text)} chars)")
        return result
        
    except HTTPException:
        logger.error("HTTPException occurred during upload")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Clean up stored document if it exists
        if 'doc_id' in locals() and doc_id in document_store:
            del document_store[doc_id]
            logger.info(f"Cleaned up document {doc_id} after error")
            
        raise HTTPException(
            status_code=500, 
            detail=f"An unexpected error occurred while processing your document. Please try again. Error: {str(e)}"
        )

@app.post("/chat")
async def chat_with_document(chat_request: ChatMessage) -> ChatResponse:
    """Chat about a specific document"""
    logger.info(f"Received chat request: {chat_request.message[:50]}...")
    
    if not GEMINI_API_KEY:
        logger.error("Gemini API key not configured")
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
    
    try:
        # Get document text from either document_id or direct text
        document_text = ""
        document_filename = "document"
        
        if chat_request.document_id:
            if not document_store:
                logger.error("Document store is not initialized")
                return ChatResponse(
                    response="The document storage system is not available. Please try uploading your document again.",
                    timestamp=datetime.now().isoformat()
                )
            
            if chat_request.document_id not in document_store:
                logger.error(f"Document ID not found: {chat_request.document_id}")
                return ChatResponse(
                    response="I couldn't find the document you're referring to. Please try uploading your document again.",
                    timestamp=datetime.now().isoformat()
                )
            
            doc_data = document_store[chat_request.document_id]
            document_text = doc_data["text"]
            document_filename = doc_data["filename"]
            logger.info(f"Using stored document: {document_filename} (ID: {chat_request.document_id})")
        elif chat_request.document_text:
            document_text = chat_request.document_text
            logger.info("Using provided document text")
        else:
            logger.warning("No document text provided")
            return ChatResponse(
                response="Please upload a document first before asking questions.",
                timestamp=datetime.now().isoformat()
            )
            
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Create chat prompt
        prompt = f"""You are analyzing a legal document. Answer the following question about it:

Document: {document_text[:25000] if len(document_text) > 25000 else document_text}

Question: {chat_request.message}

Please provide a clear and concise answer based on the document content."""

        # Generate response
        response = model.generate_content(prompt)
        return ChatResponse(
            response=response.text.strip(),
            timestamp=datetime.now().isoformat()
        )
            
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return ChatResponse(
            response=f"I encountered an error while processing your question. Please try again. Error: {str(e)}",
            timestamp=datetime.now().isoformat()
        )

@app.get("/document/{document_id}")
async def get_document_info(document_id: str) -> Dict[str, Any]:
    """Get information about a stored document"""
    if document_id not in document_store:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc_info: Dict[str, Any] = document_store[document_id]
    return {
        "document_id": document_id,
        "filename": doc_info["filename"],
        "upload_time": doc_info["upload_time"],
        "text_length": len(doc_info["text"]),
        "text_preview": doc_info["text"][:200] + "..." if len(doc_info["text"]) > 200 else doc_info["text"]
    }

@app.get("/")
async def root() -> Dict[str, str]:
    return {"message": "AI Legal Document Explainer API", "status": "running"}

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {
        "status": "healthy",
        "gemini_configured": bool(GEMINI_API_KEY),
        "documents_stored": len(document_store),
        "stored_document_ids": list(document_store.keys())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

handler = Mangum(app)