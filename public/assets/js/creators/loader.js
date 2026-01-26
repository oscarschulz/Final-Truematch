export async function loadView(elementId, filePath) {
    const container = document.getElementById(elementId);
    if (!container) return;

    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load ${filePath}`);
        
        const html = await response.text();
        container.innerHTML = html;
    } catch (error) {
        console.error(`❌ Error loading component from ${filePath}:`, error);
    }
}