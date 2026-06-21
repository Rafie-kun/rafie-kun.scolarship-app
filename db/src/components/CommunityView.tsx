import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, Plus, CheckCircle, Sparkles, X } from 'lucide-react';
import { CommunityPost } from '../types';
import { playClickSound, playAdvancementSound } from '../utils/sound';
import { useAuth } from '../context/AuthContext';

export default function CommunityView() {
  const { authorizedFetch } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Submit thread form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General Discussion');
  const [content, setContent] = useState('');
  const [success, setSuccess] = useState('');

  const rewardedActionsRef = React.useRef<Set<string>>(new Set());
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await authorizedFetch('/api/community');
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts().then(() => setLoading(false));
  }, []);

  const handleUpvote = async (id: string) => {
    playClickSound();
    try {
      const res = await authorizedFetch(`/api/community/${id}/vote`, { method: 'POST' });
      const data = await res.json();
      setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await authorizedFetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category })
      });
      const data = await res.json();
      setPosts(data);
      
      // Reward user for joining study forum discussions
      const actionName = `Created forum thread: ${title}`;
      if (!rewardedActionsRef.current.has(actionName)) {
        rewardedActionsRef.current.add(actionName);
        await authorizedFetch('/api/profile/reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: 20,
            actionName,
            badgeToUnlock: "Vocal Scholar"
          })
        });
      }

      setSuccess(`Admissions feed updated! Posted discussion thread.`);
      playAdvancementSound();
      
      setTitle('');
      setContent('');
      setShowForm(false);
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6" id="scholarpath-town-square-forum">
      {/* Title block */}
      <div className="mc-window border-4 border-black p-5 text-stone-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-press text-xs text-stone-900 uppercase flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-stone-900 shrink-0" /> Town Square Admissions Forum
            </h3>
            <p className="text-xs text-stone-700 font-sans mt-2 leading-relaxed">
              Exchange interview logs, ECTS conversions analysis, certified document translation guides, and motivation letters feedback with fellow globally-bound scholars.
            </p>
          </div>
          <button
            id="community-new-post-btn"
            onClick={() => { setShowForm(!showForm); playClickSound(); }}
            className="mc-btn px-4 py-2.5 text-[9px] uppercase tracking-wider transition-colors shrink-0 font-bold"
          >
            {showForm ? 'Close Board' : 'New Post'}
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-950/40 border-4 border-[#55ff55] text-[#55ff55] p-3 text-xs font-mono rounded-none flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5 text-[#55ff55] shrink-0 animate-bounce" />
          <span className="mc-text-shadow font-bold">{success} (+20 XP Granted!)</span>
        </div>
      )}

      {/* New thread creation form popup/drawer */}
      {showForm && (
        <form onSubmit={handleSubmitPost} className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] rounded-none space-y-4 max-w-2xl mx-auto text-stone-200">
          <h4 className="font-press text-[9px] text-[#ffff55] mc-text-shadow uppercase pb-2 border-b-2 border-black">
            DRAFT ADMISSIONS BULLETIN
          </h4>
          
          <div className="space-y-3 font-mono text-xs">
            <div className="flex flex-col gap-1.5">
              <span className="text-stone-400 uppercase text-[9px]">Thread Title</span>
              <input
                type="text"
                placeholder="e.g., 'Tip on validating university transcripts in Bangladesh'..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-[#141414] border-2 border-black p-2.5 text-xs focus:outline-none focus:border-[#ffff55] rounded-none w-full text-stone-200"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-stone-400 uppercase text-[9px]">Forum Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-[#141414] border-2 border-black p-2.5 text-xs focus:outline-none focus:border-[#ffff55] rounded-none w-full text-stone-200"
              >
                <option>General Discussion</option>
                <option>Essays & SOP</option>
                <option>Interviews</option>
                <option>Standardized Tests</option>
                <option>Visa & Logistics</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-stone-400 uppercase text-[9px]">Intel Contents</span>
              <textarea
                placeholder="Share technical admissions details, ECTS credit conversions, advisor emails feedback, etc..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-[#141414] border-2 border-black p-3 min-h-[140px] text-xs focus:outline-none focus:border-[#ffff55] rounded-none w-full text-stone-200 font-sans leading-relaxed"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); playClickSound(); }}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-[10px] uppercase border-2 border-black rounded-none cursor-pointer"
            >
              Discard
            </button>
            <button
              type="submit"
              className="mc-btn px-4 py-2 text-[9px] uppercase tracking-wider font-bold"
            >
              Publish Post
            </button>
          </div>
        </form>
      )}

      {/* Posts listing */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 font-press text-[11px] text-[#ffff55] gap-3">
          <Sparkles className="w-7 h-7 animate-spin text-[#ffff55]" />
          <span className="mc-text-shadow">SYNCING FORUM INTEL FEED...</span>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {posts.map((post) => (
            <div 
              key={post.id}
              className="bg-[#2c2c2c] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#141414,inset_4px_4px_0_#555] rounded-none flex items-start gap-4 hover:border-stone-500 transition-colors"
            >
              {/* Upvote score button */}
              <button
                onClick={() => handleUpvote(post.id)}
                className="flex flex-col items-center p-2 bg-[#141414] hover:bg-[#333] border-2 border-black font-press text-[8px] text-[#ffff55] transition-colors rounded-none shrink-0 cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-amber-500 mb-1 hover:scale-115 transition-transform" />
                <span className="mc-text-shadow">{post.votes}</span>
              </button>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex justify-between items-center flex-wrap gap-2 pb-1.5 border-b border-stone-800 font-mono text-[10px]">
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold bg-[#141414] px-2 py-0.5 border border-stone-900 rounded-none uppercase text-[9px]">{post.category}</span>
                    <span className="text-stone-400 leading-5">Posted by <strong className="text-stone-300">@{post.author}</strong></span>
                  </div>
                  <span className="text-stone-500">{post.createdAt}</span>
                </div>

                <h4 className="font-press text-[10px] text-[#ffff55] mc-text-shadow leading-snug">{post.title}</h4>
                <p className="text-xs text-stone-350 font-sans leading-relaxed whitespace-pre-line">{post.content}</p>

                <div className="pt-2 text-[10px] font-mono text-stone-500 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Comments: {post.commentsCount}
                </div>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-20 bg-[#1e1c1b] border-4 border-dashed border-stone-800 font-press text-[9px] text-stone-500 uppercase leading-relaxed">
              No threads published yet.<br/>Be the first to spark an admissions conversation!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
