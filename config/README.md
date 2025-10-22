# Bucket List - How to Update

## Quick Start

Edit `config/bucket-list.md` to track your progress!

## ✨ Automatic Numbering

**Numbers are auto-generated!** You can use either format:

- **With numbers:** `1. **Item** - Description`
- **Without numbers:** `**Item** - Description`

Just move items between sections - no need to update numbers manually.

## How to Mark Items as Completed

1. **Move** the item from `## 📋 Pending` to `## ✅ Completed`
2. **Update counters** in section headers: `(0/100)` → `(1/100)`
3. **Add completion date**: `**Item** - Description (Completed: Oct 25, 2025)`
4. **Numbers update automatically** based on position in section

## How to Mark Items as In Progress

1. **Move** item from `## 📋 Pending` to `## 🚧 In Progress`
2. **Update counters** in both sections
3. **Add start date**: `**Item** - Description (Started: Oct 24, 2025)`
4. **Numbers update automatically** based on position in section

## Adding New Items

1. **Add** to `## 📋 Pending` section at the end
2. **Update counter**: `(99/100)` → `(100/100)`
3. **Use either format**:
   - `**New Goal** - Your description here`
   - `100. **New Goal** - Your description here`
4. **Number appears automatically** when displayed

## Example

**Before:**

```markdown
## ✅ Completed (0/100)

## 🚧 In Progress (0/100)

## 📋 Pending (100/100)

**Learn guitar** - Master basic chords
```

**After:**

```markdown
## ✅ Completed (1/100)

**Learn guitar** - Master basic chords (Completed: Oct 25, 2025)

## 🚧 In Progress (0/100)

## 📋 Pending (99/100)
```

✅ **No numbers needed in markdown!** They appear automatically: #1, #2, #3...

## What Happens Next

✅ **Save file** - Changes appear immediately in development
🚀 **Deploy** - Updates go live on your site
📊 **Progress bar** updates automatically
🎨 **Colors** change based on status

**View your progress at:** `yoursite.com/list100`
