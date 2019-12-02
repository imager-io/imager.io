<style>
	@media (max-width: 600px) {
		header {
			flex-direction: column !important;
		}
	}
	header {
		display: flex;
		flex-direction: row;
		margin: 0;
		padding: 0;
		justify-content: center;
		align-items: center;
		padding: 0 5px 5px;
		width: 90%;
		margin: 0 auto;
		margin-bottom: 30px;
	}
	header > div.banner {
		padding: 16px 32px;
		background: #1b1b1b;
		color: #0ff3d3;
		display: flex;
    	flex-direction: column;
	}
	header > div.banner > h1 {
		font-size: 3em;
	}
	header > div.banner > hr {
		width: 100%;
		margin: 0;
		margin-bottom: 10px;
		margin-top: 10px;
		border: 1px solid #0ff3d3;
	}
	header > div.banner > * {
		display: flex;
		align-items: center;
	}
	header > div.banner a {
		color: #0ff3d3;
		text-decoration: none;
		font-size: 0.9em;
		margin-bottom: 4px;
	}
	header > div.banner a:last-child {
		margin-bottom: 0;
	}
	header > div.banner a > i {
		margin-right: 5px;
		font-size: 1em;
	}
	header > div.banner a > span:hover {
		text-decoration: underline;
	}
	h1, h2, h3 {
		font-family: 'Orbitron', sans-serif;
		margin: 0;
		padding:  0;
	}
	p {
		font-family: 'Montserrat', sans-serif;
		margin: 0;
		padding: 10px;
		color: #333;
	}
	pre {
		overflow: scroll;
		margin: 10px;
	}
	table th {
		min-width: 100px;
	}
	table {
		border-collapse: collapse;
		margin: 10px;
	}
	th, td {
		border: 1px solid #333;
		padding: 4px 12px;
		justify-content: center;
		font-size: 0.9em;
	}

	main {
		width: 90%;
		margin: 0 auto;	
	}
	main > section:last-child {
		margin-bottom: 100px;
	}
	main > h2 {
		font-size: 1.5em;
    	border-bottom: 3px solid #333333;
		padding-bottom: 5px;
    	margin: 20px 0;
	}
	main > h2 > a {
		text-decoration: none;
		color: inherit;
	}
	main > h2 > a:hover {
		text-decoration: underline;
	}

	section {
		margin-bottom: 20px;
	}
	section > h3 {
		margin: 10px 0;
	}
	section blockquote {
		border-left: 4px solid #525252;
		padding-left: 14px;
		color: #525252;
		margin: 10px 0;
	}
	section > * {
		margin: 14px 0;
		padding: 0;
	}
	section pre {
		padding: 4px;
	}
	pre[code] {
		max-width: 800px;
		background: #1b1b1b2b;
		padding: 8px;
		border-radius: 3px;
		color: #000;
	}
	code[path] {
		color: #3c3c3c;
	}
	code[highlight] {
		color: #19067d;
	}
	code[string] {
		color: #3c3c3c;
	}
</style>

<header class="top">
	<div class="banner">
		<h1>Imager</h1>
		<hr>
		<a href="https://github.com/imager-io">
			<i class="fab fa-github"></i>
			<span>GitHub Organization</span>
		</a>
		<a href="mailto: hello@colbyn.com">
			<i class="fas fa-envelope"></i>
			<span>hello@colbyn.com</span>
		</a>
	</div>
	<div>
		<p><b>Site performance tools for efficiently distributing media on the web.</b> <small>Everything is free and open source, with absolutely no SAAS lock-ins or vendors.</small></p>
	</div>
</header>

<main>
	<h2>Features</h2>
	<section>
		<h3>Brute Force Image Optimization</h3>
		<blockquote>Optimizes the compression using ML based metrics in a trial ’n error sorta manner.</blockquote>
		<p>This is a tool that can competitively optimize <small>(e.g.)</small> <b>extremely noisy, high resolution images</b>; at the expense of increased encoding time and CPU overhead. This is a tradeoff that should be suitable for over 90% of online content, where site performance matters.</p>
		<p>It's pretty easy too.</p>
		
		<small>Using the CLI interface:</small>
		<pre code>
$ imager -i <code path>path/to/input/images/*.jpeg</code> -o <code path>output/</code>
		</pre>
		<small>Using the HTTP server:</small>
		<pre code>
$ imager-server --address 127.0.0.1:3000
$ http 127.0.0.1:3000/opt &lt <code path>path/to/input/image.jpeg</code> &gt <code path>path/to/output/image.jpeg</code>
		</pre>
		<small>Using the JavaScript <em>non-blocking</em> API:</small>
		<pre code>
const &lcub;<code highlight>ImageBuffer</code>&rcub; = require(<code string>"imager-io"</code>);
<code highlight>ImageBuffer</code>
	<code highlight>.open(<code string>"source-image.jpeg"</code>)</code>
	.then(buffer => <code highlight>buffer.opt()</code>)
	.then(buffer => <code highlight>buffer.save(<code string>"result.jpeg"</code>)</code>)
	.then(() => console.log(<code string>"done"</code>));
		</pre>
	</section>

	<h2><a href="https://github.com/colbyn/imager-bench-2019-11-2">Compression Benchmarks <i style="font-size: 18px;" class="fas fa-external-link-alt"></i></a></h2>
	<section>
		<pre>
source        : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 39.00M (4 images)
kraken.io     : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 24M
jpegmini.com  : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 16M
compression.ai: ▇▇▇▇▇▇▇▇ 8.90M
imager        : ▇▇▇▇ 4.20M
		</pre>
	</section>

	<h2>Supported Image Optimization Formats</h2>
	<section>
		<table>
			<tr>
				<th>Format</th>
				<th>Status</th>
			</tr>
			<tr>
				<td>JPEG</td>
				<td>✅<small>GOOD</small></td>
			</tr>
			<tr>
				<td>WebP</td>
				<td>✅<small>EXPERIMENTAL</small></td>
			</tr>
			<tr>
				<td>PNG</td>
				<td>❎<small>EXPERIMENTAL</small></td>
			</tr>
		</table>
	</section>

	<h2>Ecosystem</h2>
	<section>
		<h3>Operating Systems</h3>
		<table>
			<tr>
				<th>Name</th>
				<th>Status</th>
			</tr>
			<tr>
				<td><code>Linux</code></td>
				<td>✅<small>GOOD</small></td>
			</tr>
			<tr>
				<td><code>MacOS</code></td>
				<td>✅<small>GOOD</small></td>
			</tr>
			<tr>
				<td><code>Windows</code></td>
				<td>❌<small>UNPRIORITIZED</small> <small style="color: #5f5f5f;">(Use WSL)</small></td>
			</tr>
		</table>
		<h3>Command Line Tools </h3>
		<table>
			<tr>
				<th>Name</th>
				<th>Status</th>
				<th>Description</th>
				<th>Links</th>
			</tr>
			<tr>
				<td><code>imager</code></td>
				<td>✅<small>GOOD</small></td>
				<td>The Imager CLI Interface</td>
				<td>
					<a href="https://github.com/imager-io/imager">Source</a>
					·
					<a href="https://github.com/imager-io/imager/blob/master/docs/bin/imager-cli.md">Documentation</a>
				</td>
			</tr>
			<tr>
				<td><code>imager-server</code></td>
				<td>✅<small>GOOD</small></td>
				<td>The Imager Server Interface</td>
				<td>
					<a href="https://github.com/imager-io/imager">Source</a>
					·
					<a href="https://github.com/imager-io/imager/blob/master/docs/bin/imager-server.md">Documentation</a>
				</td>
			</tr>
		</table>
		<h3>Development Tools</h3>
		<table>
			<tr>
				<th>Name</th>
				<th>Status</th>
				<th>Description</th>
				<th>Links</th>
			</tr>
			<tr>
				<td><code>WebPack</code></td>
				<td>❎<small>UNOFFICIAL</small></td>
				<td>Using Vanilla Webpack</td>
				<td><a href="https://github.com/imager-io/webpack-imager-example-vanilla">Example</a></td>
			</tr>
		</table>
		<h3>Languages</h3>
		<table>
			<tr>
				<th>Name</th>
				<th>Status</th>
				<th>Self Contained</th>
				<th>Links</th>
			</tr>
			<tr>
				<td>NodeJS</td>
				<td>✅<small>GOOD</small></td>
				<td>✅<small>YES</small></td>
				<td>
					<a href="https://github.com/imager-io/imager">Source</a>
					·
					<a href="https://github.com/imager-io/imager/blob/master/docs/imager-nodejs.md">Documentation</a>
					·
					<a href="https://github.com/imager-io/imager-nodejs-example">Example</a>
					·
					<a href="https://www.npmjs.com/package/imager-io">NPM</a>
				</td>
			</tr>
		</table>
		<h3>Low-Level Libraries</h3>
		<table>
			<tr>
				<th>Name</th>
				<th>Source</th>
				<th>Description</th>
			</tr>
			<tr>
				<td>imager-core</td>
				<td><a href="https://github.com/imager-io/imager-core">GitHub</a></td>
				<td>Imager AV Toolkit and Essential Codecs</td>
			</tr>
			<tr>
				<td>imager-advanced</td>
				<td><a href="https://github.com/imager-io/imager-advanced">GitHub</a></td>
				<td>Newer, Better Image Codecs</td>
			</tr>
		</table>
	</section>

	<h2>Articles</h2>
	<section>
		<ul>
			<li><a href="https://medium.com/@colbyn/modern-image-optimization-for-2020-issues-solutions-and-open-source-solutions-543af00e3e51">Modern Image Optimization for 2020 - Issues, Solutions, and Open Source Solutions</a></li>
		</ul>
	</section>
</main>
