import { searchCompetitors } from './search';
import { categorizeProduct } from './categorize';
import { MOCK_PRODUCTS, TAXONOMY } from './data';

// Info Toggle Handling
const infoBtn = document.getElementById('infoToggleBtn');
const infoContent = document.getElementById('infoContent');
const mockProductsPre = document.getElementById('mockProductsPre');
const taxonomyPre = document.getElementById('taxonomyPre');

if (infoBtn && infoContent && mockProductsPre && taxonomyPre) {
  infoBtn.addEventListener('click', () => {
    const isHidden = infoContent.style.display === 'none';
    infoContent.style.display = isHidden ? 'block' : 'none';
    infoBtn.textContent = isHidden ? 'HIDE DATA SOURCE' : 'SHOW DATA SOURCE';

    if (isHidden) {
      mockProductsPre.textContent = JSON.stringify(MOCK_PRODUCTS, null, 2);
      taxonomyPre.textContent = TAXONOMY.join('\n');
    }
  });
}

// Tab Handling
const tabs = document.querySelectorAll('.nav-tab');
const views = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs and views
    tabs.forEach(t => t.classList.remove('active'));
    views.forEach(v => {
      (v as HTMLElement).style.display = 'none';
      v.classList.remove('active');
    });

    // Add active class to clicked tab
    tab.classList.add('active');
    const viewId = (tab as HTMLElement).dataset.tab + '-view';
    const view = document.getElementById(viewId);
    if (view) {
      view.style.display = 'block';
      view.classList.add('active');
    }
  });
});

// Search Logic (View 1)
const form = document.getElementById('searchForm') as HTMLFormElement;
const searchBtn = document.getElementById('searchBtn') as HTMLButtonElement;
const loadingSection = document.getElementById('loadingSection') as HTMLDivElement;
const resultsSection = document.getElementById('resultsSection') as HTMLDivElement;
const reasoningBox = document.getElementById('reasoningBox') as HTMLDivElement;
const statsSection = document.getElementById('statsSection') as HTMLDivElement;
const resultsList = document.getElementById('resultsList') as HTMLDivElement;
const xrayLinkContainer = document.getElementById('xrayLinkContainer') as HTMLDivElement;

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productName = (document.getElementById('productName') as HTMLInputElement).value;
  const maxPrice = parseFloat((document.getElementById('maxPrice') as HTMLInputElement).value);

  // Show loading
  searchBtn.disabled = true;
  loadingSection.style.display = 'block';
  resultsSection.style.display = 'none';

  try {
    const result = await searchCompetitors({
      productName,
      maxPrice
    });

    // Hide loading
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';

    // Display reasoning
    reasoningBox.innerHTML = `
      <h4>🧠 AI Reasoning</h4>
      <p>${result.reasoning}</p>
    `;

    // Display stats
    statsSection.innerHTML = `
      <div class="stat-card">
        <div class="label">Total Candidates</div>
        <div class="value">${result.stats.total}</div>
      </div>
      <div class="stat-card">
        <div class="label">Filtered Out</div>
        <div class="value">${result.stats.filtered}</div>
      </div>
      <div class="stat-card">
        <div class="label">Final Results</div>
        <div class="value">${result.stats.final}</div>
      </div>
    `;

    // Display X-Ray link
    const xrayEndpoint = import.meta.env.VITE_XRAY_ENDPOINT || 'http://localhost:3000';
    xrayLinkContainer.innerHTML = `
      <a href="${xrayEndpoint.replace(':3000', ':3001')}/events/${result.traceId}" 
         target="_blank" 
         class="xray-link">
        📊 View in X-Ray Viewer
      </a>
    `;

    // Display results
    if (result.competitors.length === 0) {
      resultsList.innerHTML = '<p style="color: #718096;">No competitors found matching your criteria.</p>';
    } else {
      resultsList.innerHTML = result.competitors.map(product => `
        <div class="result-item">
          <h3>${product.name}</h3>
          <p>
            <span class="badge">$${product.price}</span>
            <span class="badge">${product.brand}</span>
            <span class="badge">Match Score: ${product.relevanceScore}</span>
          </p>
          <p style="margin-top: 0.5rem;">
            <strong>Features:</strong> ${product.features.join(', ')}
          </p>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Search error:', error);
    loadingSection.style.display = 'none';
    alert('Search failed. Please check your OpenAI API key in .env file.');
  } finally {
    searchBtn.disabled = false;
  }
});

// Categorization Logic (View 2)
const catForm = document.getElementById('catForm') as HTMLFormElement;
const catBtn = document.getElementById('catBtn') as HTMLButtonElement;
const catLoading = document.getElementById('catLoading') as HTMLDivElement;
const catResults = document.getElementById('catResults') as HTMLDivElement;
const catReasoningBox = document.getElementById('catReasoningBox') as HTMLDivElement;
const catFinalCard = document.getElementById('catFinalCard') as HTMLDivElement;
const catXrayLink = document.getElementById('catXrayLink') as HTMLDivElement;
const catFunnel = document.getElementById('catFunnel') as HTMLDivElement;

catForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = (document.getElementById('catTitle') as HTMLInputElement).value;
  const desc = (document.getElementById('catDesc') as HTMLTextAreaElement).value;

  catBtn.disabled = true;
  catLoading.style.display = 'block';
  catResults.style.display = 'none';

  try {
    const result = await categorizeProduct(title, desc);

    catLoading.style.display = 'none';
    catResults.style.display = 'block';

    // Display Reasoning
    catReasoningBox.innerHTML = `
            <h4>🧠 Categorization Reasoning</h4>
            <p>${result.reasoning}</p>
        `;

    // Display Result Card
    catFinalCard.innerHTML = `
            <div class="cat-result-label">Selected Category</div>
            <div class="cat-result-value">${result.category}</div>
            <div class="cat-confidence">Confidence: ${(result.confidence * 100).toFixed(0)}%</div>
        `;

    // Display X-Ray Link
    const xrayEndpoint = import.meta.env.VITE_XRAY_ENDPOINT || 'http://localhost:3000';
    catXrayLink.innerHTML = `
            <a href="${xrayEndpoint.replace(':3000', ':3001')}/events/${result.traceId}" 
            target="_blank" 
            class="xray-link">
            📊 View Decision Trace
            </a>
        `;

    // Display Candidates/Funnel Visual
    catFunnel.innerHTML = `
            <h4>Top Candidates</h4>
            ${result.candidates.map(c => `
                <div class="funnel-bar">
                    <span class="label">${c.category}</span>
                    <div class="bar-container">
                        <div class="bar" style="width: ${c.score * 100}%"></div>
                    </div>
                    <span class="score">${(c.score * 100).toFixed(0)}</span>
                </div>
            `).join('')}
        `;

  } catch (error) {
    console.error('Categorization failed:', error);
    alert('Categorization failed. See console.');
    catLoading.style.display = 'none';
  } finally {
    catBtn.disabled = false;
  }
});
