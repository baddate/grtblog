// Batch i18n migration script for admin Vue components
// Reads zh locale, maps known Chinese strings to keys, does safe replacements

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const ZH = JSON.parse(readFileSync(join(ROOT, 'src/locales/zh/admin.json'), 'utf-8'));
const EN = JSON.parse(readFileSync(join(ROOT, 'src/locales/en/admin.json'), 'utf-8'));

// Build reverse map: Chinese → key
const zhToKey = new Map();
for (const [key, value] of Object.entries(ZH)) {
  zhToKey.set(value, key);
}

// Specific Chinese → key overrides for multi-word or ambiguous strings
const overrides = {
  '保存': 'admin.common.save',
  '取消': 'admin.common.cancel',
  '确定': 'admin.common.confirm',
  '删除': 'admin.common.delete',
  '编辑': 'admin.common.edit',
  '新建': 'admin.common.create',
  '搜索': 'admin.common.search',
  '重置': 'admin.common.reset',
  '返回': 'admin.common.back',
  '刷新': 'admin.common.refresh',
  '关闭': 'admin.common.close',
  '提交': 'admin.common.submit',
  '复制': 'admin.common.copy',
  '导出': 'admin.common.export',
  '导入': 'admin.common.import',
  '预览': 'admin.common.preview',
  '上传': 'admin.common.upload',
  '启用': 'admin.common.enabled',
  '禁用': 'admin.common.disabled',
  '是': 'admin.common.yes',
  '否': 'admin.common.no',
  '全部': 'admin.common.all',
  '更多': 'admin.common.more',
  '操作': 'admin.common.actions',
  '状态': 'admin.common.status',
  '名称': 'admin.common.name',
  '标题': 'admin.common.title',
  '描述': 'admin.common.description',
  '类型': 'admin.common.type',
  '创建时间': 'admin.common.created_at',
  '更新时间': 'admin.common.updated_at',
  '创建人': 'admin.common.creator',
  '无': 'admin.common.none',
};

let addedKeys = 0;

function addKey(key, zhValue, enValue) {
  if (ZH[key] !== undefined) return;
  ZH[key] = zhValue;
  EN[key] = enValue;
  zhToKey.set(zhValue, key);
  addedKeys++;
}

function findOrCreateKey(chinese) {
  if (overrides[chinese]) return overrides[chinese];
  if (zhToKey.has(chinese)) return zhToKey.get(chinese);
  return null;
}

// Replace Chinese strings in Vue templates
function replaceInVue(content, filePath) {
  let changed = false;

  // Pattern 1: Table column titles: title: '中文' → title: t('key')
  content = content.replace(/title:\s*['"]([^'"]*[一-鿿][^'"]*)['"]/g, (match, chinese) => {
    const key = findOrCreateKey(chinese);
    if (key) { changed = true; return `title: t('${key}')`; }
    return match;
  });

  // Pattern 2: Naive UI labels: label="中文" → :label="$t('key')"
  content = content.replace(/label="([^"]*[一-鿿][^"]*)"/g, (match, chinese) => {
    const key = findOrCreateKey(chinese);
    if (key) { changed = true; return `:label="$t('${key}')"`; }
    return match;
  });

  // Pattern 3: Card titles: title="中文" → :title="$t('key')"
  content = content.replace(/title="([^"]*[一-鿿][^"]*)"/g, (match, chinese) => {
    const key = findOrCreateKey(chinese);
    if (key) { changed = true; return `:title="$t('${key}')"`; }
    return match;
  });

  // Pattern 4: NButton/NTag text: >中文< → >{{ $t('key') }}<
  content = content.replace(/>([一-鿿]{1,20})</g, (match, chinese) => {
    const key = findOrCreateKey(chinese);
    if (key) { changed = true; return `>{{ $t('${key}') }}<`; }
    return match;
  });

  // Pattern 5: message.success('中文') → message.success(t('key'))
  content = content.replace(/message\.(success|error|warning|info)\(['"]([^'"]*[一-鿿][^'"]*)['"]\)/g, (match, level, chinese) => {
    const key = findOrCreateKey(chinese);
    if (key) { changed = true; return `message.${level}(t('${key}'))`; }
    return match;
  });

  // Pattern 6: placeholder="中文" → :placeholder="$t('key')"
  content = content.replace(/placeholder="([^"]*[一-鿿][^"]*)"/g, (match, chinese) => {
    const key = findOrCreateKey(chinese);
    if (key) { changed = true; return `:placeholder="$t('${key}')"`; }
    return match;
  });

  return { content, changed };
}

// Walk src directory recursively
function walkDir(dir, callback) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.name.endsWith('.vue')) {
      callback(fullPath);
    }
  }
}

let totalFiles = 0;
let totalChanged = 0;

// Process all Vue files
walkDir(join(ROOT, 'src'), (filePath) => {
  totalFiles++;
  const original = readFileSync(filePath, 'utf-8');
  const { content, changed } = replaceInVue(original, filePath);

  if (changed) {
    writeFileSync(filePath, content);
    totalChanged++;
    console.log(`  ✓ ${filePath.replace(ROOT + '/', '')}`);
  }
});

// Save updated locale files with new keys sorted
if (addedKeys > 0) {
  const sortKeys = (obj) => Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  );
  writeFileSync(join(ROOT, 'src/locales/zh/admin.json'), JSON.stringify(sortKeys(ZH), null, 2) + '\n');
  writeFileSync(join(ROOT, 'src/locales/en/admin.json'), JSON.stringify(sortKeys(EN), null, 2) + '\n');
}

console.log(`\nDone: ${totalChanged}/${totalFiles} files changed, ${addedKeys} new keys added`);
