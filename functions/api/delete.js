export async function onRequestPost(context) {
  try {
    const { filename } = await context.request.json(); // اسم الملف المرفوع مثل: abc123.jpg
    const userhash = context.env.CATBOX_USERHASH;

    if (!filename || !userhash) {
      return new Response(JSON.stringify({ error: 'Delete Data not complete' }), { status: 400 });
    }

    const catboxData = new FormData();
    catboxData.append('reqtype', 'deletefiles');
    catboxData.append('userhash', userhash);
    catboxData.append('files', filename); // يأخذ اسم الملف فقط وليس الرابط الكامل

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': '*/*'
      },
      body: catboxData
    });

    const result = (await response.text()).trim();

    if (!result || result.startsWith('ERROR')) {
      return new Response(JSON.stringify({ error: result || 'Delete rejected by file host.' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, response: result }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}