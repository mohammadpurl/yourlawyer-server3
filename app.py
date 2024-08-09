import os
from langchain.document_loaders import PyPDFLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from dotenv import load_dotenv
from flask import Flask, request, jsonify

# Load environment variables from .env file
load_dotenv()

# Access the OpenAI API key from environment variables
openai_api_key = os.getenv("OPENAI_API_KEY")

# Initialize the OpenAI API key
os.environ["OPENAI_API_KEY"] = openai_api_key

app = Flask(__name__)


# Load and vectorize documents only once when the application starts
def load_and_vectorize_documents():
    loaders = [PyPDFLoader("/content/requests.pdf")]
    docs = []
    for loader in loaders:
        docs.extend(loader.load())

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=150)
    splits = text_splitter.split_documents(docs)

    embedding = OpenAIEmbeddings()
    vectordb = Chroma.from_documents(documents=splits, embedding=embedding)
    return vectordb


vectordb = load_and_vectorize_documents()

# Initialize the OpenAI LLM
llm = ChatOpenAI(model_name="gpt-3.5-turbo")

# Initialize the QA chain
memory = ConversationBufferMemory(memory_key="chat_history", return_message=True)
retriever = vectordb.as_retriever()
qa = ConversationalRetrievalChain.from_llm(llm, retriever, memory=memory)


# Define the API endpoint to handle questions
@app.route("/ask", methods=["POST"])
def ask_question():
    data = request.json
    question = data.get("question")
    if not question:
        return jsonify({"error": "No question provided"}), 400

    answer = qa({"question": question})["answer"]
    return jsonify({"answer": answer})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
