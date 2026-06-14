import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

/**
 * POST /api/v1/requirements
 * Input: requirement text from user
 * Output: PRD, user stories, backlog
 */
app.post('/api/v1/requirements', (req, res) => {
  const { requirement } = req.body;

  if (!requirement) {
    return res.status(400).json({ error: 'requirement is required' });
  }

  // TODO: Integrate with Claude API
  // const prd = await claudeAnalyzeRequirement(requirement);

  res.json({
    message: 'Requirement received',
    requirement,
    status: 'processing',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

export default app;
