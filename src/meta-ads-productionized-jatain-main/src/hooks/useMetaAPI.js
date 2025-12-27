import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { collection, query, getDocs, limit, onSnapshot } from 'firebase/firestore'
import { MetaAdsAPI, AdDataManager } from '../services/api'

const dataManager = new AdDataManager()

export function useMetaAPI() {
  const { currentUser } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [connectedAccount, setConnectedAccount] = useState(null)

  // Load connected account from Firestore with real-time updates
  useEffect(() => {
    if (!currentUser) {
      setConnectedAccount(null)
      return
    }

    console.log('👂 Setting up real-time listener for Meta accounts...')

    // Use onSnapshot for real-time updates
    const q = query(
      collection(db, 'users', currentUser.uid, 'metaAccounts'),
      limit(1)
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const accountData = snapshot.docs[0].data()
        console.log('✅ Meta account loaded:', accountData.adAccountName)
        setConnectedAccount(accountData)
        
        // Initialize API with OAuth token
        if (accountData.accessToken && accountData.adAccountId) {
          console.log('🔧 Initializing Meta API with token...')
          dataManager.initialize(accountData.accessToken, accountData.adAccountId)
        }
      } else {
        console.log('⚠️ No Meta accounts found')
        setConnectedAccount(null)
      }
    }, (err) => {
      console.error('❌ Error loading account:', err)
      setError(err.message)
    })

    return () => unsubscribe()
  }, [currentUser])

  const initialize = useCallback(() => {
    return dataManager.isConfigured()
  }, [])

  const isConfigured = useCallback(() => {
    return dataManager.isConfigured()
  }, [])

  const refreshData = useCallback(async (dateRange = 'today') => {
    if (!isConfigured()) {
      setError('Meta API not configured')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await dataManager.fetchAllData(dateRange)
      setData(result)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [isConfigured])

  const createCampaign = useCallback(async (campaignData) => {
    if (!dataManager.metaAPI) {
      throw new Error('Meta API not initialized')
    }

    return await dataManager.metaAPI.createCampaign(campaignData)
  }, [])

  const updateCampaignStatus = useCallback(async (campaignId, status) => {
    if (!dataManager.metaAPI) {
      throw new Error('Meta API not initialized')
    }

    return await dataManager.metaAPI.updateCampaignStatus(campaignId, status)
  }, [])

  return {
    data,
    loading,
    error,
    refreshData,
    createCampaign,
    updateCampaignStatus,
    isConfigured,
    connectedAccount
  }
}
