# Usage Examples

## Example Analyses

### Example 1: E-commerce Site

**Input:**
- URL: `https://example-store.com`
- Target Audience: `online shoppers looking for sustainable fashion`
- Page Goal: `purchase products`

**What to expect:**
- Analysis of product presentation
- CTA effectiveness
- Trust signals (reviews, shipping, returns)
- Mobile shopping experience indicators
- Urgency and scarcity tactics

### Example 2: SaaS Landing Page

**Input:**
- URL: `https://example-saas.com`
- Target Audience: `small business owners who need project management tools`
- Page Goal: `sign up for free trial`

**What to expect:**
- Value proposition clarity
- Feature vs. benefit balance
- Social proof placement
- Pricing transparency
- Trial friction analysis

### Example 3: Agency Website

**Input:**
- URL: `https://example-agency.com`
- Target Audience: `CMOs at B2B companies looking for marketing agencies`
- Page Goal: `book a consultation call`

**What to expect:**
- Authority and credibility signals
- Portfolio and case study analysis
- Contact form friction
- Service clarity
- Differentiation analysis

### Example 4: Personal Blog

**Input:**
- URL: `https://example-blog.com`
- Target Audience: `developers interested in web performance optimization`
- Page Goal: `subscribe to newsletter`

**What to expect:**
- Content clarity and expertise
- Subscribe form visibility
- Navigation and discoverability
- About section effectiveness
- Content value demonstration

## Demo Mode Example

If you don't have API keys, try this:

1. Leave API keys blank in `.env.local`
2. Start the app: `npm run dev`
3. Enter any valid URL: `https://example.com`
4. Target audience: `tech-savvy professionals`
5. Page goal: `sign up for our service`

You'll get a **realistic mock report** that demonstrates all features.

## Testing Different Target Audiences

Same URL, different audiences = different insights:

**URL:** `https://notion.so`

### Test 1: Students
- Target Audience: `college students looking for note-taking apps`
- Expected focus: Simplicity, pricing, collaboration features

### Test 2: Executives
- Target Audience: `busy executives who need to organize information`
- Expected focus: Time-saving, power features, integrations

### Test 3: Teams
- Target Audience: `remote teams looking for knowledge management`
- Expected focus: Collaboration, permissions, structure

## Good URLs to Test

### Fast-loading, analysis-friendly sites:
- ✅ `https://stripe.com`
- ✅ `https://linear.app`
- ✅ `https://vercel.com`
- ✅ `https://github.com`
- ✅ `https://tailwindcss.com`

### Sites that may be slow or block scraping:
- ⚠️ Heavy JavaScript SPAs
- ⚠️ Sites with aggressive anti-bot measures
- ⚠️ Sites requiring authentication
- ⚠️ Very large/complex pages

## Reading the Report

### Score Interpretation

- **80-100**: Excellent first impression
  - Clear value proposition
  - Strong trust signals
  - Minimal friction
  - Effective CTAs

- **60-79**: Good but needs improvement
  - Value proposition exists but could be clearer
  - Some confusion points
  - Trust signals present but weak
  - CTAs could be stronger

- **0-59**: Needs attention
  - Unclear what the company does
  - Significant confusion
  - Weak or missing trust signals
  - Poor CTA visibility

### Understanding Time

- **0-3s**: Exceptional clarity
- **4-7s**: Good clarity
- **8-12s**: Acceptable
- **13+s**: Too slow, visitors will leave

### Priority Actions

Actions are ranked by:

**Impact:**
- High: Significant improvement to conversions
- Medium: Noticeable improvement
- Low: Minor enhancement

**Difficulty:**
- Easy: Can be done in minutes/hours
- Medium: Requires design or dev work
- Hard: Major changes needed

**Pro tip:** Start with "High Impact + Easy Difficulty" actions first!

## Interpreting Persona Feedback

### First-time visitor
- Represents your actual target audience
- Most important feedback
- Focus on their main concern

### CEO/Decision maker
- Budget and ROI focused
- Looks for proof and numbers
- Important for B2B sites

### UX Expert
- Design and usability focus
- Hierarchy and flow
- Important for all sites

### Marketing Expert
- Copy and messaging focus
- Emotional hooks
- Conversion optimization

### Clarity Analyst
- Information architecture
- Communication effectiveness
- Fundamental clarity issues

## Advanced Usage Tips

### 1. Compare competitors

Analyze 3-4 competitor sites with the same target audience to see:
- Common patterns in your industry
- What your competitors do well
- Gaps you can exploit

### 2. Test your own site regularly

Run analysis:
- After major redesigns
- When launching new products
- Quarterly as a checkup
- Before marketing campaigns

### 3. Use specific page goals

Instead of generic "convert visitors", try:
- "Book a 15-minute demo call"
- "Download our free guide"
- "Start a 14-day trial"
- "Add to cart and checkout"

More specific = better analysis!

### 4. Test landing pages vs. homepages

Landing pages and homepages serve different purposes:
- Landing pages: Single goal, specific audience
- Homepages: Multiple audiences, multiple paths

Analyze separately!

### 5. Mobile vs. Desktop

The analysis extracts data that works for both, but remember:
- Mobile visitors have different context
- Mobile screens show less content
- Consider running separate analyses

## Common Patterns in Results

### Good Sites Usually Have:
- ✅ Clear headline that states what you do
- ✅ Subheadline that explains the benefit
- ✅ Social proof above the fold
- ✅ One dominant CTA
- ✅ Visual hierarchy
- ✅ Fast understanding time (< 5s)

### Sites That Need Work Usually:
- ❌ Generic "Welcome" headlines
- ❌ Jargon without explanation
- ❌ Multiple competing CTAs
- ❌ No social proof visible
- ❌ Slow understanding time (> 10s)
- ❌ Unclear target audience

## API Response Format

The API returns JSON in this format:

\`\`\`json
{
  "success": true,
  "data": {
    "score": 75,
    "understandingTimeSeconds": 6,
    "firstThought": "...",
    "targetAudienceInterpretation": "...",
    "clarityIssues": [...],
    "trustSignals": [...],
    "reasonsToLeave": [...],
    "conversionOpportunities": [...],
    "recommendedHeroRewrite": {
      "headline": "...",
      "subheadline": "...",
      "cta": "..."
    },
    "personaFeedback": [...],
    "priorityActions": [...],
    "summary": "..."
  }
}
\`\`\`

Or on error:

\`\`\`json
{
  "success": false,
  "error": "Error message here"
}
\`\`\`

## Troubleshooting Common Issues

### Issue: "URL must use http/https..."

**Problem:** Invalid URL format
**Solution:** Make sure to include `https://` at the start

### Issue: Analysis takes very long

**Problem:** Site is slow or has lots of JavaScript
**Solution:** Try a simpler site first, or increase timeout

### Issue: Mock data keeps appearing

**Problem:** OpenRouter API key not set or invalid
**Solution:** Check `.env.local` has correct `OPENROUTER_API_KEY`

### Issue: Empty or incomplete analysis

**Problem:** Site may be blocking scrapers
**Solution:** Try a different site, or check console for errors

### Issue: "Target audience must be at least 3 characters"

**Problem:** Too short audience description
**Solution:** Be specific: "small business owners" not "SMB"

## Best Practices

1. **Be specific with target audience**
   - ✅ "busy parents looking for meal planning apps"
   - ❌ "people"

2. **Define clear page goals**
   - ✅ "schedule a free consultation"
   - ❌ "do something"

3. **Test multiple times**
   - Same site, different audiences
   - Different competitors, same audience

4. **Act on the insights**
   - Don't just read the report
   - Implement high-impact, easy actions first
   - Measure the results

5. **Save your reports**
   - Copy to clipboard
   - Save in your project management tool
   - Track changes over time

## Questions?

Common questions:

**Q: Can I analyze password-protected sites?**
A: No, the tool can only analyze publicly accessible pages.

**Q: Can I analyze multiple pages at once?**
A: Not in this version. Analyze one page at a time.

**Q: How accurate is the analysis?**
A: It's AI-based pattern recognition, not real user testing. Use it as a starting point, not the final word.

**Q: Can I customize the analysis criteria?**
A: Not currently, but you can modify the prompt in `src/lib/openrouter.ts`.

**Q: Is my data saved anywhere?**
A: No, analyses are not stored. Everything is temporary.

**Q: Can I export to PDF?**
A: Not yet, but you can copy the report and paste into a document.

## Next Steps

1. Run your first analysis
2. Review the recommendations
3. Implement the top 3 priority actions
4. Re-analyze to see improvement
5. Share feedback or issues

Happy analyzing! 🚀
