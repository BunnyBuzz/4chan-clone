export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ error: 'File not selected.' }), { status: 400 });
    }

    if (typeof file === 'string' || !file.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Images only.' }), { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Max 10MB.' }), { status: 400 });
    }

    // قراءة الـ userhash المكتوب في إعدادات Cloudflare
    const userhash = context.env.CATBOX_USERHASH;

    const catboxData = new FormData();
    catboxData.append('reqtype', 'fileupload');
    
    // ربط الرفع بحسابك لتمتلك صلاحية الحذف
    if (userhash) {
      catboxData.append('userhash', userhash);
    }
    
    catboxData.append('fileToUpload', file);

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxData
    });

    if (!response.ok) throw new Error('Upload failed to server,');

    const url = (await response.text()).trim();

    if (!url || url.startsWith('ERROR')) {
      throw new Error(url || 'Upload rejected by file host.');
    }

    return new Response(JSON.stringify({ url: url }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}