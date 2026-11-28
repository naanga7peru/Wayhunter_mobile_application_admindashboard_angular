import { Component, isDevMode } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'wayhunter-login-page',
  imports: [RouterLink],
  template: `
    <main class="login-screen">
          <svg class="luxury-background" viewBox="0 0 1600 1000" preserveAspectRatio="none"
            aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="adm01-metal" x1="0" y1="1" x2="1" y2="0">
                <stop stop-color="#8d4f0b" />
                <stop offset=".22" stop-color="#df9d31" />
                <stop offset=".43" stop-color="#fff2ae" />
                <stop offset=".5" stop-color="#fff9dc" />
                <stop offset=".62" stop-color="#e9ad44" />
                <stop offset=".85" stop-color="#9f6115" />
                <stop offset="1" stop-color="#f3bd58" />
              </linearGradient>
              <linearGradient id="adm01-wire">
                <stop stop-color="#966317" stop-opacity=".45" />
                <stop offset=".33" stop-color="#f4b640" />
                <stop offset=".52" stop-color="#fff0aa" />
                <stop offset=".78" stop-color="#dda33d" />
                <stop offset="1" stop-color="#966317" stop-opacity=".45" />
              </linearGradient>
              <linearGradient id="adm01-upright-wire" href="#adm01-wire"
                gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="200" y2="640" />
              <linearGradient id="adm01-liquid" gradientUnits="userSpaceOnUse"
                x1="0" y1="0" x2="210" y2="0" spreadMethod="repeat" gradientTransform="skewX(-18)">
                <stop stop-color="#9b5917" stop-opacity="0" />
                <stop offset=".24" stop-color="#864707" stop-opacity=".36" />
                <stop offset=".47" stop-color="#f5b347" stop-opacity=".16" />
                <stop offset=".59" stop-color="#ffdc83" stop-opacity=".56" />
                <stop offset=".64" stop-color="#fff8df" stop-opacity=".88" />
                <stop offset=".69" stop-color="#ffdf92" stop-opacity=".55" />
                <stop offset=".76" stop-color="#bc761b" stop-opacity=".25" />
                <stop offset=".84" stop-color="#fff1b8" stop-opacity=".32" />
                <stop offset="1" stop-color="#9b5917" stop-opacity="0" />
              </linearGradient>
              <path id="adm01-upper-shape" d="M0 214C83 96 174 41 253 0H442C351 54 279 52 177 99 86 140 34 191 0 235Z" />
              <clipPath id="adm01-upper-clip"><use href="#adm01-upper-shape" /></clipPath>
              <path id="adm01-lower-shape" d="M1600 678C1443 731 1388 813 1302 875 1238 922 1155 944 1004 970 1287 953 1402 857 1600 834Z" />
              <clipPath id="adm01-lower-clip"><use href="#adm01-lower-shape" /></clipPath>
              <path id="adm01-fold-shape" d="M0 230C115 139 188 129 318 121 460 112 553 82 600 0V78C523 154 409 157 298 184 252 195 205 209 173 230Z" />
              <clipPath id="adm01-fold-clip"><use href="#adm01-fold-shape" /></clipPath>
            </defs>
            <path class="blue-fold" d="M0 207C155 94 403 151 642 0H478C325 96 103 91 0 151ZM1600 341C1469 560 1490 687 1198 798L1600 741Z" />
            <use class="corner-ribbon" href="#adm01-upper-shape" />
            <g clip-path="url(#adm01-upper-clip)">
              <path class="liquid-ridge" d="M0 222C75 125 138 84 203 49S260 24 307 0" />
              <rect class="liquid-flow liquid-flow--upper" x="-210" width="652" height="235" />
            </g>
            <use class="corner-ribbon" href="#adm01-lower-shape" />
            <g clip-path="url(#adm01-lower-clip)">
              <path class="liquid-ridge" d="M1600 760C1461 797 1405 860 1315 907S1170 947 1070 960" />
              <rect class="liquid-flow liquid-flow--lower" x="794" y="678" width="806" height="292" />
            </g>
            <g class="gold-wires">
              <path id="adm01-wire-0" pathLength="100" d="M0 337C178 39 374 167 603 0" />
              <use class="line-reflection" href="#adm01-wire-0" />
              <path id="adm01-wire-1" pathLength="100" d="M1050 163C1332 -42 1370 -28 1600 151" />
              <use class="line-reflection" href="#adm01-wire-1" />
              <path id="adm01-wire-2" pathLength="100" d="M0 604C201 592 300 747 419 810" />
              <use class="line-reflection" href="#adm01-wire-2" />
              <path id="adm01-wire-3" pathLength="100" d="M0 785C184 752 243 838 402 837" />
              <use class="line-reflection" href="#adm01-wire-3" />
              <path id="adm01-wire-4" pathLength="100" d="M1130 760C1435 757 1470 586 1600 498" />
              <use class="line-reflection" href="#adm01-wire-4" />
              <path id="adm01-wire-5" pathLength="100" d="M845 1000C1020 932 1200 944 1328 883S1503 765 1600 739" />
              <use class="line-reflection" href="#adm01-wire-5" />
              <path id="adm01-wire-6" class="upright-wire" pathLength="100" d="M141 390V595" />
              <use class="line-reflection" href="#adm01-wire-6" />
              <path id="adm01-wire-7" class="upright-wire" pathLength="100" d="M158 269V638" />
              <use class="line-reflection" href="#adm01-wire-7" />
              <path id="adm01-wire-8" class="upright-wire" pathLength="100" d="M176 315V638" />
              <use class="line-reflection" href="#adm01-wire-8" />
              <path id="adm01-wire-9" class="upright-wire" pathLength="100" d="M1416 284V553" />
              <use class="line-reflection" href="#adm01-wire-9" />
              <path id="adm01-wire-10" class="upright-wire" pathLength="100" d="M1432 200V586" />
              <use class="line-reflection" href="#adm01-wire-10" />
              <path id="adm01-wire-11" class="upright-wire" pathLength="100" d="M1447 288V539" />
              <use class="line-reflection" href="#adm01-wire-11" />
            </g>
          </svg>
      <div class="login-card">
        <div class="welcome-panel" aria-hidden="true">
          <div class="glass">
            <svg class="panel-fold" viewBox="0 0 600 230" preserveAspectRatio="none" focusable="false">
              <path fill="#092554" d="M0 230H600V5C551 159 387 156 233 185 166 198 123 211 91 230Z" />
              <use fill="url(#adm01-metal)" href="#adm01-fold-shape" />
              <path fill="#fff5d5" fill-opacity=".62" stroke="#fff7e4" stroke-width="2"
                d="M0 230C115 139 188 129 318 121 460 112 553 82 600 0V32C535 119 449 132 316 144 194 156 108 181 65 230Z" />
              <g clip-path="url(#adm01-fold-clip)">
                <rect class="liquid-flow liquid-flow--fold" x="-210" width="810" height="230" />
              </g>
            </svg>
          </div>
          <div class="welcome-copy">
            <svg class="brand-mark" viewBox="0 0 254 185" focusable="false">
              <path fill="#082353" d="M23 66H64Q68 66 71 72L110 155L90 181 49 90Q43 74 23 66ZM92 66H133Q138 66 142 73L159 104 129 125 114 91Q105 74 92 66ZM174 66H211L153 182 136 145 160 126 179 88Q182 74 174 66Z" />
              <path fill="url(#adm01-metal)" d="M46 112C-3 165-4 187 37 174 98 155 172 109 211 71L216 82 226 43 188 62 201 64C156 110 85 152 44 160 20 165 20 147 46 112Z" />
              <path fill="url(#adm01-metal)" d="M235 5L240 24 257 28 240 33 235 52 230 33 213 28 230 24Z" />
            </svg>
            <div class="wordmark">WAYHUNTER</div>
            <div class="portal-title">Admin portal</div>
            <p class="welcome-title">Welcome<br /> back!</p>
            <div class="welcome-ornament">✦</div>
          </div>
        </div>
        <section class="login-pane" aria-labelledby="sign-in-title">
          <h1 id="sign-in-title">Wayhunter Admin<br /> Sign In</h1>
          <div id="sign-in-status" class="notice">
            <span class="notice-icon" aria-hidden="true">i</span>
            <div>
              <strong>Sign-in unavailable</strong>
              <p>
                Admin sign-in requires verified server-side session and permission checks. This screen
                cannot accept credentials yet.
              </p>
            </div>
          </div>
          <form
            aria-labelledby="sign-in-title"
            aria-describedby="sign-in-status"
            (submit)="$event.preventDefault()"
          >
            <fieldset disabled>
              <label for="admin-email">Email address</label>
              <div class="credential-field">
                <svg class="field-icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M3 5h18v14H3zM3 6l9 7 9-7" />
                </svg>
                <input id="admin-email" type="email" autocomplete="off" required />
              </div>
              <label for="admin-password">Password</label>
              <div class="credential-field">
                <svg class="field-icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                <input id="admin-password" type="password" autocomplete="off" required />
                <button
                  class="password-eye"
                  type="button"
                  aria-label="Show password"
                  aria-controls="admin-password"
                  disabled
                >
                  <svg
                    aria-hidden="true"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                  >
                    <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="2.5" />
                    <path d="M4 20 20 4" />
                  </svg>
                </button>
              </div>
              <button class="sign-in" type="submit">Sign in</button>
            </fieldset>
          </form>
          @if (showPreview) {
            <a routerLink="/preview">Local development preview</a>
          }
        </section>
      </div>
    </main>
  `,
  styleUrls: ['./login.page.scss', './login-background.scss', './login-motion.scss'],
})
export class LoginPage {
  protected readonly showPreview = isDevMode();
}
