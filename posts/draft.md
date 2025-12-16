Memory-related bugs are some of the most common and costly security failures in software.

The industry has been burned by these bugs since before the Morris worm incident made headlines in 1988. Here we are 37 years later and the same class of security bugs are still happening today. If we want to fix these bugs we first need to understand them: what kind of bug it is, how it’s triggered, how it’s fixed, and how to detect the next one before it ships. We need to be able to classify them.'

Classifying software bugs is harder than I thought.

I assumed that state of the art large language models (LLMs) would excel at the task. There’s a public database of security vulnerabilities from NIST (the CVE database), and each entry includes natural-language descriptions, code snippets, and an assigned weakness type (CWE). I thought I could give an LLM the code and ask it to classify the weakness into one of the known categories. These model are good at writing code, they should be able to spot these bugs.

They failed to classify the weakness in spectacular fashion. Less than 50% accuracy.

It's not the models fault

I dug deep into the data and tried to understand how the labels were assigned. Turns out that the labeling is inconstant. Inconstant labeling is not surprising, labeling any dataset is difficult. CWEs are assigned manually by in a community-driven analysis process. I should not have been expecting fine grained CWEs to be consistent. The definitions were not precise enough, many CVEs had multiple bugs and some didn't match the code. The ground truth isn't there to be learned.

The existing labels weren't good enough, let's make our own!

Bottom-Up Classification

Since the existing CWE labels were not defined as clearly, I decided to try to make a bottom-up classification system. The idea is to make embeddings from the sections of code that contained the bugs, then cluster the issues and give them labels. The rules for labeling could then be created and ideally more consistent than the existing ones.

What are Embeddings?

The central questions is, "Are these two bug the same kind of bug?" What is needed is a way to compress the error into its essential characteristics. We don't care about all the extraneous details, just the weakness. We want similar bugs to be compressed into the same space.

Imagine you wanted to decide whether two vulnerabilities are the same kind of mistake. One way to do that is to invent a bunch of axes ahead of time:

Does it read memory out of bounds?Does it write memory out of bounds?Is there a missing bounds check?Is the pointer uninitialized?Does the buffer size depend on untrusted input?

If you had hundreds or thousands of these axes, you can map every bug into a coordinate space.

However this has a large number of drawbacks. You have to define the axes ahead of time. If you don't include some or define others poorly the system falls apart. It's labor intense in the extreme to get this process right.

Embeddings flip this process around. We start with the space and define the axes later.

The model learns to define the axes by the similarities in the code between the pairs of similar bugs.

That’s what embeddings give us:
a bottom-up, data-driven map of software weaknesses, instead of a brittle top-down taxonomy.

But to train embeddings, we need a reliable way to say when two bugs are the same.

How Do We Know When Two Bugs Are the Same?

The question is now, how do we get pairs of bug that are the same? We could manually compare all the bug and try to sort them. Obviously this would be a laborious process.
Rather we can use the idea of "LLM as a Judge"(paper citation).

The idea is to ask a large language model directly:

“Here are two pieces of buggy code.
Are these the same kind of bug?”

My instincts are that LLMs have a far easier time doing this than assigning CWE labels.
If you give them the right prompt, they can look at the mechanics of each function
and tell you whether both exhibit, say, an out-of-bounds write or an uninitialized read.

So the natural plan was:
use an LLM as a judge to score each pair of bugs on similarity.

But there was one problem.

The combinatorial explosion

If you have 1,000 bugs, comparing every pair means one million comparisons.
Even at a few cents per model call, that becomes expensive, slow, and unwieldy—
and most of those comparisons are pointless.
Bugs from different domains or different weakness families will obviously not match.
We don’t need an AI to tell us that.
