"use client";

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';


import "../app.css";
import "@aws-amplify/ui-react/styles.css";

export const GameSessionLink =() => {

  return (
    <div>
      <p>
        Send this link to friends:{" "}
        <a href= {process.env.DOMAIN} target="_blank" rel="noopener noreferrer">
          {process.env.DOMAIN}
        </a>
      </p>
    </div>
  );
};
