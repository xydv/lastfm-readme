import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { html, raw } from 'hono/html';
import { generateBars, querySchema } from './helpers';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getSongData } from './services/lastFm';

const app = new Hono<{ Bindings: Env }>();

const DEFAULT_IMAGE = 'https://images.aditya.stream/lastfm.png';

app.use(cors());

app.get('/:username', zValidator('param', z.object({ username: z.string() })), zValidator('query', querySchema), async (c) => {
	const { username } = c.req.valid('param');
	const { dark, spin, color, rainbow, useDominantColor } = c.req.valid('query');
	const { name, url, artist, image, dominantColor } = await getSongData(username, c.env.LASTFM_APIKEY, DEFAULT_IMAGE);

	// template from: https://github.com/tthn0/Spotify-Readme
	return c.body(
		// using html`` as its easy to insert variables
		html`<svg width="495" height="160" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			<foreignObject width="495" height="160">
				<div xmlns="http://www.w3.org/1999/xhtml" class="container">
					<style>
						html, body, div, span, h1, p, a, img {
						  margin: 0;
						  padding: 0;
						  border: 0;
						  font-size: 100%;
						  font: inherit;
						  vertical-align: baseline;
						}
						a {
						  text-decoration: none;
						}
						main {
						  display: flex;
						  padding: 20px;
						  border-radius: 5px;
							${dark ? 'background: #161B22;' : 'background: #F6F8FA;'}
						}
						.cover {
						  width: 120px;
						  height: 120px;
							${spin ? `border-radius: 50%;\nanimation: spin 0ms -800ms linear infinite;\nanimation-duration: 10s;` : 'border-radius: 10px;'}
							${dark ? 'box-shadow: 0 0 10px 5px #1b2027;' : 'box-shadow: 0 0 10px 5px #f1f3f5;'}
						}
						section {
						  padding-left: 20px;
						  width: 100%;
						  display: flex;
						  flex-direction: column;
						  justify-content: space-between;
						  align-items: center;
						}
						.info {
						  margin-top: 16px;
						  display: flex;
						  flex-direction: column;
						  align-items: center;
						  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji;
						}
						.top {
						  display: flex;
						  align-items: center;
						}
						h1 {
						  font-size: 20px;
						  font-weight: 600;
						  white-space: nowrap;
						  text-overflow: ellipsis;
						  display: block;
						  overflow: hidden;
						  max-width: 260px;
							${dark ? 'color: aliceblue;' : 'color: #161B22;'}
						}
						p {
						  margin-top: 5px;
						  font-size: 18px;
						  font-weight: 500;
						  white-space: nowrap;
						  text-overflow: ellipsis;
						  display: block;
						  overflow: hidden;
						  max-width: 260px;
							${dark ? 'color: rgba(240, 248, 255, calc(2/3));' : 'color: rgba(22, 27, 34, calc(2/3));'}
						}
						.logo {
						  width: 24px;
						  height: 24px;
						}
						.bar-container {
						  display: flex;
						  animation: rainbow 0ms -800ms linear infinite;
						}
						.bar {
						  border-radius: 3px 3px 0 0;
						  height: 30px;
						  transform-origin: bottom;
						  animation: resize 0ms -800ms ease-in-out infinite alternate;
						  width: 20px;
						}
						.bar:not(:first-child) {
						  margin-left: 6px;
						}
						@keyframes spin {
						  100% {
						    transform: rotate(360deg)
						  }
						}
						@keyframes rainbow {
						  100% {
						    filter: hue-rotate(360deg)
						  }
						}
						@keyframes resize {
						  0% {
						    transform: scaleY(0);
						    opacity: .05;
						  }
						  100% {
						    transform: scaleY(1);
						    opacity: .95;
						  }
						}
					</style>
					<a href="${url}" target="_blank">
						<main>
							<img class="cover" src="data:image/png;base64,${image}" alt="cover image for ${name}" />
							<section>
								<div class="info">
									<div class="top">
										<h1>${name}</h1>
									</div>
									<p>${artist}</p>
								</div>
								<div class="bar-container">${raw(generateBars(rainbow, useDominantColor ? dominantColor : color))}</div>
							</section>
						</main>
					</a>
				</div>
			</foreignObject>
		</svg>`.toString(),
		200,
		{
			'cache-control': 'max-age=0, no-cache, no-store, must-revalidate',
			'content-type': 'image/svg+xml',
		},
	);
});

app.get('/open/:username', zValidator('param', z.object({ username: z.string() })), async (c) => {
	const { username } = c.req.valid('param');
	const { url } = await getSongData(username, c.env.LASTFM_APIKEY, DEFAULT_IMAGE);
	return c.redirect(url);
});

app.notFound((c) => {
	return c.redirect('https://github.com/dedomil/lastfm-readme');
});

export default app;
