require('dotenv').config({ path: '.env.local' });

async function listModels() {
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
        console.error("No API key found.");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1alpha/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.models) {
        const bidiModels = data.models.filter(m =>
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes('bidiGenerateContent')
        );
        console.log("Models supporting bidiGenerateContent:");
        bidiModels.forEach(m => console.log(m.name));
    } else {
        console.log(data);
    }
}

listModels();
