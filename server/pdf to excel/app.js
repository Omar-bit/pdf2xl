const dropContainer = document.getElementById('drop-container');
const convert = document.getElementById('convert');
dropContainer.addEventListener('dragover', handleDragOver);
dropContainer.addEventListener('drop', handleFileDrop);

const input = document.getElementById('file');
input.addEventListener('change', handleInputChange);

function handleInputChange() {
  const file = input.files[0];
  const element = document.createElement('p');
  element.innerHTML = file.name;
  document.querySelector('#drop-container').append(element);

  // convertToExcel(file);
  element.style.marginTop = '20px';
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleFileDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  const input = document.getElementById('file');
  input.files = event.dataTransfer.files;
  document.getElementById('file').name = file;
  const element = document.createElement('p');
  element.innerHTML = file.name;
  element.style.marginTop = '20px';
  document.querySelector('#drop-container').append(element);
  // convertToExcel(file);
}

function convertToExcel() {
  const downloadLink = document.getElementById('download-link');
  downloadLink.href = 'http://localhost:5000/data.csv';
  document.getElementById('download-container').style.display = 'flex';
}
async function submit() {
  const file = document.getElementById('file').files[0];
  const formData = new FormData();
  formData.append('pdf', file);
  try {
    const response = await fetch('http://localhost:5000/api/convertpdf2xl', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    const downloadLink = document.getElementById('download-link');
    downloadLink.href = data.url;
    document.getElementById('download-container').style.display = 'flex';
    convertToExcel();
  } catch (err) {
    alert('error converting pdf to excel');
    console.log(err);
  }
}
