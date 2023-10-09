import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Popup.css';
import useSWR from 'swr';
import { removeTrailingSlash } from '../../utils/normalUtils';
import Login from '../components/Login';

const refreshInterval = 20000;

const fetcher = async (url) => {
  const response = await fetch(url); // This is a GET request now
  if (!response.ok) {
    throw new Error('Failed to fetch');
  }
  return response.json();
};
const Popup = () => {
  const [cursorCurrent, setCursorCurrent] = useState(null);
  const [cursorParent, setCursorParent] = useState(null);
  const [activeTab, setActiveTab] = useState('current'); // defaulting to 'current' tab

  const [currentURL, setCurrentURL] = useState('');
  const [parentURL, setParentURL] = useState('');

  useEffect(() => {
    // Fetch the current tab's URL using the Chrome Extensions API
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let url = new URL(tabs[0].url);
      setCurrentURL(removeTrailingSlash(url.href)); // remove trailing slash and set as current URL
      url = removeTrailingSlash(`${url.protocol}//${url.hostname}`); // remove trailing slash from the domain
      setParentURL(url); // setting the sanitized domain as the parent URL
    });
  }, []);

  const loadMoreRef = useRef(null);

  const getUrlWithCursor = (url, cursor) =>
    cursor ? `${url}&cursor=${encodeURIComponent(cursor)}` : url;

  const {
    data: apiDataCurrent,
    mutate: mutateCurrent,
    isLoading: isLoadingCurrent,
  } = useSWR(
    getUrlWithCursor(
      `http://localhost:4000/get_channel?url=${currentURL}`,
      cursorCurrent
    ),
    fetcher,
    { refreshInterval }
  );

  const {
    data: apiDataParent,
    mutate: mutateParent,
    isLoading: isLoadingParent,
  } = useSWR(
    getUrlWithCursor(
      `http://localhost:4000/get_channel?url=${parentURL}`,
      cursorParent
    ),
    fetcher,
    { refreshInterval }
  );
  const castsCurrent = apiDataCurrent?.casts || [];
  const castsParent = apiDataParent?.casts || [];

  const loadingCurrent = isLoadingCurrent; // Adjust this if you have a specific loading mechanism
  const loadingParent = isLoadingParent; // Adjust this if you have a specific loading mechanism

  const nextCursorCurrent = apiDataCurrent?.next.cursor;
  const nextCursorParent = apiDataParent?.next.cursor;

  const observer = new IntersectionObserver(
    async (entries) => {
      const activeApiData =
        activeTab === 'current' ? castsCurrent : castsParent;
      const activeCursor =
        activeTab === 'current' ? nextCursorCurrent : nextCursorParent;
      const mutate = activeTab === 'current' ? mutateCurrent : mutateParent;

      if (entries[0].isIntersecting && activeCursor) {
        const nextData = await fetcher(
          `http://localhost:4000/get_channel?url=${currentURL}&cursor=${activeCursor})`
        );
        mutate(
          (prev) => ({
            ...nextData,
            casts: [...(prev?.casts || []), ...(nextData.casts || [])],
          }),
          false
        );
      }
    },
    { threshold: 0.8 }
  );

  useEffect(() => {
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreRef, observer]);
  console.log('currentCasts', castsCurrent);
  return (
    <div className="wrapper">
      <div className="flex-content">
        <div className="fixed-header">
          <p className="url-name">
            Casts for: {activeTab === 'current' ? currentURL : parentURL}
          </p>

          <div className="tab-container">
            {currentURL !== parentURL ? (
              <>
                <button onClick={() => setActiveTab('current')}>
                  Current URL
                </button>
                <button onClick={() => setActiveTab('parent')}>
                  Parent URL
                </button>
              </>
            ) : null}
          </div>
        </div>
        {activeTab === 'current' && <>{renderCasts(castsCurrent)}</>}

        {activeTab === 'parent' && <>{renderCasts(castsParent)}</>}
      </div>

      <div className="login-section">
        <Login parent={activeTab === 'current' ? currentURL : parentURL} />
      </div>
    </div>
  );

  function renderCasts(casts) {
    return (
      <div className="flex-content">
        {casts && casts.length ? (
          casts.map((cast, index) => {
            const embedURL =
              cast.embeds && cast.embeds.length > 0 ? cast.embeds[0].url : null;
            const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(embedURL);
            const isVideo = /\.(mp4|mov|webm|ogv)$/i.test(embedURL);
            const textWithoutEmbed = embedURL
              ? cast.text.replace(embedURL, '').trim()
              : cast.text;
            const hasRef = index === casts.length - 1;

            return (
              <div
                ref={hasRef ? loadMoreRef : null}
                key={index}
                className="cast-item"
              >
                <img
                  src={cast.author.pfp_url}
                  alt={`${cast.author.display_name} profile`}
                  width="50"
                />
                <div>
                  <h4>{cast.author.display_name}</h4>
                  <p>@{cast.author.username}</p>
                  <p>{textWithoutEmbed}</p>
                  {isImage && (
                    <img
                      src={embedURL}
                      alt="Embedded image"
                      width="100"
                      height="100"
                    />
                  )}
                  {isVideo && (
                    <video width="100" height="100" controls>
                      <source
                        src={embedURL}
                        type={`video/${embedURL.split('.').pop()}`}
                      />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  {!isImage && !isVideo && embedURL && (
                    <a
                      href={embedURL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {embedURL}
                    </a>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="url-name">No casts available</p>
        )}
      </div>
    );
  }
};

export default Popup;
