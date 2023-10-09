console.log('Background script is running.');

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === 'get_messages') {
    console.log('Received message from popup:', request.message);

    const urlType = request.data.urlType;
    const url = request.data.url;
    const cursor = request.data.cursor || null;

    try {
      const response = await fetch(
        `http://localhost:4000/get_channel?url=${encodeURIComponent(url)}${
          cursor ? '&cursor=' + encodeURIComponent(cursor) : ''
        }`
      );
      const data = await response.json();
      console.log('get_messages', data);
      // Adjusting the message structure to inform the popup which data is for which URL.
      sendMessageToPopup({
        ...data,
        urlType,
      });

      sendResponse(data);
    } catch (error) {
      console.error('Error fetching data from the server:', error);
      sendResponse({ error: 'Error fetching data from the server.' });
    }
    return true; // This ensures that the sendResponse can be called asynchronously.
  }
});

const sendMessageToPopup = (data) => {
  chrome.runtime.sendMessage({
    message: 'background_to_popup',
    data: data,
  });
};
