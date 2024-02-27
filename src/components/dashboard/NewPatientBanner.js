import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';

export default function MyComponent(props) {
  return (
    <>
      <div className="div">
        <div className="div-2">
          <Link
            href="/dashboard/patients/new"
            style={{
              alignItems: 'center',
              borderRadius: '5px',
              backgroundColor: '#4f3cc9',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '11px',
              padding: '9px 13px 9px 18px',
            }}
          >
            <Image
              src="/assets/images/icon-new-order-w.svg"
              width={24}
              height={24}
              alt=""
            />
            <div className="div-3">Nuevo Paciente</div>
          </Link>
        </div>
        <div className="div-4">Crear un paciente nuevo</div>
      </div>
      <style jsx>{`
        .div {
          align-self: stretch;
          background-color: var(--Gray-6, #f2f2f2);
          display: flex;
          gap: 9px;
          padding: 17px 30px;
          margin-bottom: 30px;
        }
        @media (max-width: 991px) {
          .div {
            flex-wrap: wrap;
          }
        }

        .img {
          aspect-ratio: 1;
          object-fit: contain;
          object-position: center;
          width: 14px;
          overflow: hidden;
          max-width: 100%;
          margin: auto 0;
        }
        .div-3 {
          color: var(--Gray-6, #f2f2f2);
          align-self: stretch;
          flex-grow: 1;
          white-space: nowrap;
          font: 400 18px Roboto, sans-serif;
        }
        @media (max-width: 991px) {
          .div-3 {
            white-space: initial;
          }
        }
        .div-4 {
          color: var(--Gray-2, #4f4f4f);
          align-self: center;
          flex-grow: 1;
          white-space: nowrap;
          margin: auto 0;
          font: 400 12px Roboto, sans-serif;
        }
        @media (max-width: 991px) {
          .div-4 {
            white-space: initial;
            display: none;
          }
        }
      `}</style>
    </>
  );
}
