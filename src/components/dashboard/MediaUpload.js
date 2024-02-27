import Image from 'next/image';
import React, { useRef } from 'react';

export default function MediaUpload(props) {
  const { onImageChange } = props;
  const label = useRef(null);
  const _onChange = (e) => {
    const filename = e.target.files[0].name;
    label.current.innerHTML = filename;
    onImageChange(e.target.files[0]);
  };
  return (
    <>
      <div>
        <input
          type="file"
          id="file"
          onChange={_onChange}
          className="inputfile"
        />

        <label ref={label} htmlFor="file" className="label">
          <Image
            src="/assets/images/theme-light/upload-icon.svg"
            width={24}
            height={24}
            alt="Upload"
          />
          Choose a file
        </label>
      </div>
      <style jsx>{`
        .inputfile {
          width: 0.1px;
          height: 0.1px;
          opacity: 0;
          overflow: hidden;
          position: absolute;
          z-index: -1;
        }
        .label {
          font-size: 1em;
          font-weight: 500;
          color: white;
          background-color: black;
          display: inline-block;
          cursor: pointer;
          outline: 1px dotted #000;
          outline: -webkit-focus-ring-color auto 5px;
          padding: 0.5em 0.75em;
          background-color: #0070f0;
          border-radius: 0.25em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .label:focus,
        .label:hover {
          opacity: 0.8;
        }
      `}</style>
    </>
  );
}
