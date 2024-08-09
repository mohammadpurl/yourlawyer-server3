// app.js
const {
  loadAndProcessFiles,
  saveEmbeddings,
  loadEmbeddings,
  similaritySearch,
} = require("./../src/models/embeddingModule");

module.exports = async () => {
  const filePaths = ["../Data/requests.pdf"];
  console.log(filePaths);
  const splits = await loadAndProcessFiles(filePaths);
  await saveEmbeddings(splits);

  // Load embeddings and perform similarity search
  const question = "Sample query";
  const results = await similaritySearch(question);
  console.log(results);
};

// Example of getting a question from an API
const getQuestionFromAPI = async () => {
  // Simulating an API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        "یک نمونه نمونه درخواست آزادی مشروط به نام علی رحمتی با کد ملی 1234567890 به شماره پرونده 1234و دادنامه پیوست 1452 ایجاد کن"
      );
    }, 1000);
  });
};

const runWithAPIQuestion = async () => {
  const question = await getQuestionFromAPI();
  const results = await similaritySearch(question);
  console.log(results);
};

// main();
// or
runWithAPIQuestion();
