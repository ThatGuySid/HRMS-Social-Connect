import { useState, useEffect } from 'react'
import { Plus, Bell, Award, TrendingUp, Users, Star, Heart, MessageCircle, X, Search, Send } from 'lucide-react'

const Recognition = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isNotificationsPageOpen, setIsNotificationsPageOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(2)
  const [recognitions, setRecognitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState({}) // Track loading state for individual actions
  const [stats, setStats] = useState({
    totalRecognitions: 0,
    percentageChange: '+0%',
    activeParticipants: 0,
    averageRating: 0.0
  })
  // Local state for likes and comments (not stored in database)
  const [localLikes, setLocalLikes] = useState({}) // { recognitionId: { count: number, userLiked: boolean } }
  const [localComments, setLocalComments] = useState({}) // { recognitionId: [{ user: string, text: string, timestamp: Date }] }
  const [commentDialogs, setCommentDialogs] = useState({}) // { recognitionId: boolean } - track which comment dialogs are open
  const [commentInputs, setCommentInputs] = useState({}) // { recognitionId: string } - track comment input text

  // Form state for creating new recognition
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    message: '',
    category: ''
  })

  const API_BASE_URL = 'http://localhost:5000/api'

  // Fetch recognitions from API
  const fetchRecognitions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/recognitions`)
      const data = await response.json()

      if (data.success) {
        setRecognitions(data.data)
      }
    } catch (error) {
      console.error('Error fetching recognitions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch statistics from API
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recognitions/stats/overview`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Create new recognition
  const createRecognition = async (recognitionData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/recognitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recognitionData),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the recognitions list
        fetchRecognitions()
        fetchStats()
        return true
      }
      return false
    } catch (error) {
      console.error('Error creating recognition:', error)
      return false
    }
  }

  // Add like to recognition (local state only)
  const addLike = (recognitionId) => {
    try {
      setLocalLikes(prev => {
        const currentLikes = prev[recognitionId] || { count: 0, userLiked: false }

        // Prevent multiple likes from same user
        if (currentLikes.userLiked) {
          console.log('User has already liked this recognition')
          return prev
        }

        return {
          ...prev,
          [recognitionId]: {
            count: currentLikes.count + 1,
            userLiked: true
          }
        }
      })
      return true
    } catch (error) {
      console.error('Error adding like:', error)
      return false
    }
  }

  // Add comment to recognition (local state only)
  const addComment = (recognitionId, commentText, userName = 'Current User') => {
    try {
      const newComment = {
        user: userName,
        text: commentText,
        timestamp: new Date()
      }

      setLocalComments(prev => ({
        ...prev,
        [recognitionId]: [...(prev[recognitionId] || []), newComment]
      }))

      // Clear the comment input
      setCommentInputs(prev => ({
        ...prev,
        [recognitionId]: ''
      }))

      return true
    } catch (error) {
      console.error('Error adding comment:', error)
      return false
    }
  }

  // Toggle comment dialog visibility
  const toggleCommentDialog = (recognitionId) => {
    setCommentDialogs(prev => ({
      ...prev,
      [recognitionId]: !prev[recognitionId]
    }))
  }

  // Handle comment input change
  const handleCommentInputChange = (recognitionId, value) => {
    setCommentInputs(prev => ({
      ...prev,
      [recognitionId]: value
    }))
  }

  // Submit comment
  const handleSubmitComment = (recognitionId) => {
    const commentText = commentInputs[recognitionId]?.trim()
    if (!commentText) return

    const success = addComment(recognitionId, commentText)
    if (success) {
      console.log('💬 Comment added successfully!')
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchRecognitions()
    fetchStats()
  }, [])

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const handleToggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen)
  }

  const handleMarkAllRead = () => {
    setNotificationCount(0)
  }

  const handleViewAllNotifications = () => {
    setIsNotificationsOpen(false)
    setIsNotificationsPageOpen(true)
  }

  const handleCloseNotificationsPage = () => {
    setIsNotificationsPageOpen(false)
  }

  // Handle form submission
  const handleSubmitRecognition = async (e) => {
    e.preventDefault()

    // Validate form data
    if (!formData.from || !formData.to || !formData.message || !formData.category) {
      alert('Please fill in all required fields')
      return
    }

    try {
      console.log('🎉 Submitting recognition:', formData)

      const success = await createRecognition(formData)

      if (success) {
        alert('Recognition sent successfully!')
        // Reset form
        setFormData({
          from: '',
          to: '',
          message: '',
          category: ''
        })
        setIsModalOpen(false)
      } else {
        alert('Failed to send recognition. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting recognition:', error)
      alert('Error sending recognition. Please try again.')
    }
  }

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle like button click
  const handleLikeClick = (recognitionId) => {
    // Prevent multiple clicks
    if (actionLoading[`like-${recognitionId}`]) return

    try {
      setActionLoading(prev => ({ ...prev, [`like-${recognitionId}`]: true }))
      const success = addLike(recognitionId)
      if (success) {
        console.log('👍 Like added successfully!')
        // Show a brief success message (you could add a toast notification here)
      } else {
        console.error('Failed to add like')
        alert('Failed to add like. Please try again.')
      }
    } catch (error) {
      console.error('Error handling like click:', error)
      alert('Error adding like. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, [`like-${recognitionId}`]: false }))
    }
  }

  // Handle comment button click - toggle comment dialog
  const handleCommentClick = (recognitionId) => {
    toggleCommentDialog(recognitionId)
  }


  return (
    <>
      <style>{`
        .main-content {
          padding: 20px;
          background-color: #f8fafc;
          min-height: 100vh;
        }
        .main-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .main-header-enhanced {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          color: white;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .main-title-enhanced {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .main-subtitle-enhanced {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .notification-bell-enhanced {
          position: relative;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .notification-bell-enhanced:hover {
          background-color: rgba(255,255,255,0.1);
        }
        .notification-badge-enhanced {
          position: absolute;
          top: 4px;
          right: 4px;
          background-color: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }
        .stats-cards-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-left: 4px solid;
        }
        .stat-card-blue { border-left-color: #3b82f6; }
        .stat-card-green { border-left-color: #10b981; }
        .stat-card-purple { border-left-color: #8b5cf6; }
        .stat-card-orange { border-left-color: #f59e0b; }
        .stat-icon-container {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .stat-card-blue .stat-icon-container { background-color: #3b82f6; }
        .stat-card-green .stat-icon-container { background-color: #10b981; }
        .stat-card-purple .stat-icon-container { background-color: #8b5cf6; }
        .stat-card-orange .stat-icon-container { background-color: #f59e0b; }
        .stat-number {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          color: #111827;
        }
        .stat-label {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }
        .give-recognition-section-enhanced {
          text-align: center;
          margin-bottom: 32px;
        }
        .give-recognition-btn-enhanced {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .give-recognition-btn-enhanced:hover {
          transform: translateY(-2px);
        }
        .main-grid-enhanced {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        .main-left-column, .main-right-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .main-grid-enhanced {
            grid-template-columns: 1fr;
          }
          .stats-cards-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="main-content">
      <div className="main-container">
        {/* Enhanced Header with Gradient Background */}
        <div className="main-header-enhanced">
          <div className="header-content">
            <div className="header-text">
              <h1 className="main-title-enhanced">
                <Award className="title-icon" />
                Recognition & Kudos
              </h1>
              <p className="main-subtitle-enhanced">Celebrate achievements and recognize your colleagues</p>
            </div>
            <div className="header-actions">
              <div className="notification-bell-enhanced" onClick={handleToggleNotifications}>
                <Bell className="notification-icon" />
                {notificationCount > 0 && (
                  <span className="notification-badge-enhanced">
                    {notificationCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="stats-cards-row">
          <div className="stat-card stat-card-blue">
            <div className="stat-icon-container">
              <Award className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.totalRecognitions || 0}</h3>
              <p className="stat-label">Total Recognitions</p>
            </div>
          </div>
          <div className="stat-card stat-card-green">
            <div className="stat-icon-container">
              <TrendingUp className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.percentageChange || '+0%'}</h3>
              <p className="stat-label">This Month</p>
            </div>
          </div>
          <div className="stat-card stat-card-purple">
            <div className="stat-icon-container">
              <Users className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.activeParticipants || 0}</h3>
              <p className="stat-label">Active Participants</p>
            </div>
          </div>
          <div className="stat-card stat-card-orange">
            <div className="stat-icon-container">
              <Star className="stat-icon" />
            </div>
            <div className="stat-content">
              <h3 className="stat-number">{stats.averageRating || '0.0'}</h3>
              <p className="stat-label">Avg Rating</p>
            </div>
          </div>
        </div>

        {/* Enhanced Give Recognition Button */}
        <div className="give-recognition-section-enhanced">
          <button onClick={handleOpenModal} className="give-recognition-btn-enhanced">
            <Plus className="give-recognition-icon" />
            <span>Give Recognition</span>
            <div className="button-glow"></div>
          </button>
        </div>

        {/* Enhanced Main Grid Layout */}
        <div className="main-grid-enhanced">
          {/* Left Column */}
          <div className="main-left-column">
            {/* Recognition Feed */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Recent Recognition</h3>
              {recognitions.map((recognition) => (
                <div key={recognition.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                      {recognition.fromAvatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{recognition.from} → {recognition.to}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>{recognition.timestamp}</div>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 12px 0', color: '#374151' }}>{recognition.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                    <button
                      onClick={() => handleLikeClick(recognition._id)}
                      disabled={actionLoading[`like-${recognition._id}`]}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: actionLoading[`like-${recognition._id}`] ? 'not-allowed' : 'pointer',
                        color: actionLoading[`like-${recognition._id}`] ? '#9ca3af' : '#6b7280',
                        fontSize: '14px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                        opacity: actionLoading[`like-${recognition._id}`] ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!actionLoading[`like-${recognition._id}`]) {
                          e.target.style.backgroundColor = '#f3f4f6'
                          e.target.style.color = '#ef4444'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!actionLoading[`like-${recognition._id}`]) {
                          e.target.style.backgroundColor = 'transparent'
                          e.target.style.color = '#6b7280'
                        }
                      }}
                      title={actionLoading[`like-${recognition._id}`] ? "Adding like..." : "Like this recognition"}
                    >
                      {(() => {
                        const localLikeData = localLikes[recognition._id] || { count: 0, userLiked: false }
                        const isLiked = localLikeData.userLiked
                        const likeCount = localLikeData.count
                        return (
                          <>
                            <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} />
                            {actionLoading[`like-${recognition._id}`] ? '...' : likeCount}
                          </>
                        )
                      })()}
                    </button>
                    <button
                      onClick={() => handleCommentClick(recognition._id)}
                      disabled={actionLoading[`comment-${recognition._id}`]}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: actionLoading[`comment-${recognition._id}`] ? 'not-allowed' : 'pointer',
                        color: actionLoading[`comment-${recognition._id}`] ? '#9ca3af' : '#6b7280',
                        fontSize: '14px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                        opacity: actionLoading[`comment-${recognition._id}`] ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!actionLoading[`comment-${recognition._id}`]) {
                          e.target.style.backgroundColor = '#f3f4f6'
                          e.target.style.color = '#3b82f6'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!actionLoading[`comment-${recognition._id}`]) {
                          e.target.style.backgroundColor = 'transparent'
                          e.target.style.color = '#6b7280'
                        }
                      }}
                      title={actionLoading[`comment-${recognition._id}`] ? "Adding comment..." : "Add a comment"}
                    >
                      {(() => {
                        const comments = localComments[recognition._id] || []
                        const commentCount = comments.length
                        return (
                          <>
                            <MessageCircle size={16} fill={commentCount > 0 ? '#3b82f6' : 'none'} />
                            {commentCount}
                          </>
                        )
                      })()}
                    </button>
                  </div>

                  {/* Comment Dialog */}
                  {commentDialogs[recognition._id] && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      {/* Existing Comments */}
                      {localComments[recognition._id] && localComments[recognition._id].length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          {localComments[recognition._id].map((comment, index) => (
                            <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '6px', fontSize: '14px' }}>
                              <div style={{ fontWeight: '600', color: '#374151', marginBottom: '2px' }}>{comment.user}</div>
                              <div style={{ color: '#6b7280' }}>{comment.text}</div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                                {comment.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment Input */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[recognition._id] || ''}
                          onChange={(e) => handleCommentInputChange(recognition._id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSubmitComment(recognition._id)
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => handleSubmitComment(recognition._id)}
                          disabled={!commentInputs[recognition._id]?.trim()}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: commentInputs[recognition._id]?.trim() ? '#3b82f6' : '#e5e7eb',
                            color: commentInputs[recognition._id]?.trim() ? 'white' : '#9ca3af',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: commentInputs[recognition._id]?.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Send size={14} />
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recognition Analytics */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Analytics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>85%</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Participation Rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>4.2</div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>Avg per Person</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="main-right-column">
            {/* Achievement Badges */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Achievement Badges</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ textAlign: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏆</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Top Performer</div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>⭐</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Team Player</div>
                </div>
              </div>
            </div>

            {/* Top Recipients */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Top Recipients</h3>
              {['Michael Torres', 'Emily Johnson', 'Lisa Wang'].map((name, index) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', fontSize: '14px' }}>
                    {name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{name}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{15 - index * 3} recognitions</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly Stats */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Monthly Stats</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>This Month</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>67</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                  <div style={{ width: '75%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>Last Month</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>54</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                  <div style={{ width: '60%', height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Give Recognition Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Give Recognition</h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitRecognition}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>From (Your Name) *</label>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={formData.from}
                  onChange={(e) => handleInputChange('from', e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Recipient *</label>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} size={20} />
                  <input
                    type="text"
                    placeholder="Enter colleague's name..."
                    value={formData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                    style={{ width: '100%', padding: '12px 12px 12px 44px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="teamwork">Great Teamwork</option>
                  <option value="leadership">Leadership</option>
                  <option value="innovation">Innovation</option>
                  <option value="excellence">Going Above & Beyond</option>
                  <option value="collaboration">Collaboration</option>
                  <option value="mentorship">Mentorship</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Message *</label>
                <textarea
                  placeholder="Write your recognition message..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  Send Recognition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      {isNotificationsOpen && (
        <div style={{ position: 'fixed', top: '60px', right: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', width: '320px', zIndex: 1000, border: '1px solid #e5e7eb' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Notifications</h3>
              <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '14px', cursor: 'pointer' }}>
                Mark all read
              </button>
            </div>
          </div>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>New recognition received</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Sarah Chen recognized you for great teamwork</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>2 hours ago</div>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Monthly report available</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Your recognition summary is ready</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>1 day ago</div>
            </div>
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
            <button
              onClick={handleViewAllNotifications}
              style={{ width: '100%', padding: '8px', border: 'none', borderRadius: '6px', backgroundColor: '#f3f4f6', cursor: 'pointer', fontSize: '14px' }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}

      {/* Notifications Page */}
      {isNotificationsPageOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>All Notifications</h2>
              <button onClick={handleCloseNotificationsPage} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ padding: '20px', overflow: 'auto', maxHeight: 'calc(80vh - 80px)' }}>
              <div style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>New recognition received</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Sarah Chen recognized you for great teamwork on the Q4 project</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>2 hours ago</div>
              </div>
              <div style={{ marginBottom: '16px', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Monthly report available</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Your recognition summary for this month is ready to view</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>1 day ago</div>
              </div>
              <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>Achievement unlocked</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>You've earned the "Team Player" badge for helping colleagues</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>3 days ago</div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

export default Recognition;