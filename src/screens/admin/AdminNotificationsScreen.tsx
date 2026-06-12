import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import firebaseService from '../../services/firebaseService';
import notificationService from '../../services/notificationService';
import { Notification, Member } from '../../types';
import RefreshHeader from '../../components/RefreshHeader';
import { AuthContext } from '../../context/AuthContext';

const AdminNotificationsScreen = () => {
  const navigation = useNavigation();
  const authContext = React.useContext(AuthContext);
  const clan = authContext?.clan;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [membersNeedingRenewal, setMembersNeedingRenewal] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [sendingNotifications, setSendingNotifications] = useState(false);
  const [environmentInfo, setEnvironmentInfo] = useState(notificationService.getEnvironmentInfo());
  
  // Custom notification state
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [sendLocalNotification, setSendLocalNotification] = useState(true);

  useEffect(() => {
    loadData();
  }, [clan]);

  const loadData = async () => {
    try {
      const clanId = clan?.id || '';
      const [allNotifications, membersNeedingRenewal, allMembersData] = await Promise.all([
        firebaseService.getAllNotifications(clanId),
        firebaseService.getMembersNeedingRenewal(30, clanId),
        firebaseService.getMembersByClan(clanId),
      ]);
      
      setNotifications(allNotifications);
      setMembersNeedingRenewal(membersNeedingRenewal);
      setAllMembers(allMembersData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const sendRenewalNotifications = async () => {
    setSendingNotifications(true);
    try {
      await notificationService.checkAllMembersForRenewal();
      Alert.alert('Success', 'Renewal notifications sent successfully!');
      await loadData();
    } catch (error) {
      console.error('Error sending renewal notifications:', error);
      Alert.alert('Error', 'Failed to send renewal notifications');
    } finally {
      setSendingNotifications(false);
      setShowRenewalModal(false);
    }
  };

  const sendCustomNotifications = async () => {
    if (selectedMembers.size === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    if (!customTitle.trim() || !customMessage.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    setSendingNotifications(true);
    try {
      const selectedMembersList = allMembers.filter(member => selectedMembers.has(member.id));
      
      for (const member of selectedMembersList) {
        const notification: Omit<Notification, 'id'> = {
          userId: member.id,
          clanId: member.clanId,
          title: customTitle.trim(),
          message: customMessage.trim(),
          type: notificationType,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        await firebaseService.createNotification(notification);

        if (sendLocalNotification) {
          try {
            await notificationService.scheduleLocalNotification(
              customTitle.trim(),
              customMessage.trim(),
              null
            );
          } catch (error) {
            console.log('Local notification failed for member:', member.name);
          }
        }
      }

      Alert.alert('Success', `Custom notifications sent to ${selectedMembers.size} member${selectedMembers.size === 1 ? '' : 's'}!`);
      
      setSelectedMembers(new Set());
      setCustomTitle('');
      setCustomMessage('');
      setNotificationType('info');
      setShowCustomModal(false);
      
      await loadData();
    } catch (error) {
      console.error('Error sending custom notifications:', error);
      Alert.alert('Error', 'Failed to send custom notifications');
    } finally {
      setSendingNotifications(false);
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAllMembers = () => {
    setSelectedMembers(new Set(allMembers.map(member => member.id)));
  };

  const clearSelection = () => {
    setSelectedMembers(new Set());
  };

  const deleteNotification = async (notificationId: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await firebaseService.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
          } catch (error) {
            console.error('Error deleting notification:', error);
            Alert.alert('Error', 'Failed to delete notification');
          }
        },
      },
    ]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'membership_renewal': return 'calendar-outline';
      case 'warning': return 'warning-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'error': return 'close-circle-outline';
      default: return 'information-circle-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'membership_renewal': return '#FF6B35';
      case 'warning': return '#FF9500';
      case 'success': return '#34C759';
      case 'error': return '#FF3B30';
      default: return '#007AFF';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <Ionicons name={getNotificationIcon(item.type) as any} size={24} color={getNotificationColor(item.type)} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
          </Text>
          <Text style={styles.notificationUser}>User ID: {item.userId}</Text>
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNotification(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      {item.data && item.type === 'membership_renewal' && (
        <View style={styles.membershipInfo}>
          <Text style={styles.membershipInfoText}>Membership Fee: ${item.data.membershipFee}</Text>
          <Text style={styles.membershipInfoText}>
            Expires: {new Date(item.data.membershipEndDate!).toLocaleDateString()}
          </Text>
          {item.data.daysUntilExpiry !== undefined && (
            <Text style={[styles.daysUntilExpiry, item.data.daysUntilExpiry <= 7 ? styles.urgent : styles.warning]}>
              {item.data.daysUntilExpiry === 0 
                ? 'Expired today' 
                : `${item.data.daysUntilExpiry} day${item.data.daysUntilExpiry === 1 ? '' : 's'} remaining`
              }
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderMemberItem = ({ item }: { item: Member }) => (
    <TouchableOpacity
      style={[styles.memberItem, selectedMembers.has(item.id) && styles.selectedMemberItem]}
      onPress={() => toggleMemberSelection(item.id)}
    >
      <View style={styles.memberItemContent}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{item.name}</Text>
          <Text style={styles.memberEmail}>{item.email}</Text>
          <Text style={styles.memberStatus}>
            Status: {item.membershipStatus} • Expires: {new Date(item.membershipEndDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.memberSelection}>
          <Ionicons
            name={selectedMembers.has(item.id) ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={selectedMembers.has(item.id) ? '#007AFF' : '#C7C7CC'}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRenewalModal = () => (
    <Modal visible={showRenewalModal} transparent={true} animationType="slide" onRequestClose={() => setShowRenewalModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Renewal Notifications</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowRenewalModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {environmentInfo.isExpoGo && (
              <View style={styles.expoGoWarning}>
                <Ionicons name="information-circle" size={20} color="#FF9500" />
                <Text style={styles.expoGoWarningText}>
                  Running in Expo Go - Only local notifications will be sent. For full push notifications, use a development build.
                </Text>
              </View>
            )}
            
            <Text style={styles.modalDescription}>
              This will send renewal notifications to {membersNeedingRenewal.length} members whose memberships are expiring within 30 days.
            </Text>
            
            <View style={styles.membersList}>
              <Text style={styles.membersListTitle}>Members needing renewal:</Text>
              {membersNeedingRenewal.slice(0, 5).map((member) => (
                <Text key={member.id} style={styles.memberTextItem}>
                  • {member.name} - Expires: {new Date(member.membershipEndDate).toLocaleDateString()}
                </Text>
              ))}
              {membersNeedingRenewal.length > 5 && (
                <Text style={styles.memberTextItem}>... and {membersNeedingRenewal.length - 5} more</Text>
              )}
            </View>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowRenewalModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, sendingNotifications && styles.sendButtonDisabled]}
              onPress={sendRenewalNotifications}
              disabled={sendingNotifications}
            >
              <Text style={styles.sendButtonText}>
                {sendingNotifications ? 'Sending...' : 'Send Notifications'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCustomModal = () => (
    <Modal visible={showCustomModal} transparent={true} animationType="slide" onRequestClose={() => setShowCustomModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, styles.largeModalContainer]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Custom Notifications</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowCustomModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {environmentInfo.isExpoGo && (
              <View style={styles.expoGoWarning}>
                <Ionicons name="information-circle" size={20} color="#FF9500" />
                <Text style={styles.expoGoWarningText}>
                  Running in Expo Go - Only local notifications will be sent. For full push notifications, use a development build.
                </Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Type</Text>
              <View style={styles.typeButtons}>
                {(['info', 'warning', 'success', 'error'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, notificationType === type && styles.selectedTypeButton]}
                    onPress={() => setNotificationType(type)}
                  >
                    <Ionicons name={getNotificationIcon(type)} size={16} color={notificationType === type ? 'white' : getNotificationColor(type)} />
                    <Text style={[styles.typeButtonText, notificationType === type && styles.selectedTypeButtonText]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notification Message</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Notification Title"
                value={customTitle}
                onChangeText={setCustomTitle}
                maxLength={100}
              />
              <TextInput
                style={styles.messageInput}
                placeholder="Notification Message"
                value={customMessage}
                onChangeText={setCustomMessage}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            <View style={styles.section}>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Send Local Notification</Text>
                <Switch
                  value={sendLocalNotification}
                  onValueChange={setSendLocalNotification}
                  trackColor={{ false: '#C7C7CC', true: '#007AFF' }}
                  thumbColor={sendLocalNotification ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.memberSelectionHeader}>
                <Text style={styles.sectionTitle}>Select Members ({selectedMembers.size} selected)</Text>
                <View style={styles.selectionButtons}>
                  <TouchableOpacity style={styles.selectionButton} onPress={selectAllMembers}>
                    <Text style={styles.selectionButtonText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.selectionButton} onPress={clearSelection}>
                    <Text style={styles.selectionButtonText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <FlatList
                data={allMembers}
                renderItem={renderMemberItem}
                keyExtractor={(item) => item.id}
                style={styles.membersList}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCustomModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sendButton, sendingNotifications && styles.sendButtonDisabled]}
              onPress={sendCustomNotifications}
              disabled={sendingNotifications}
            >
              <Text style={styles.sendButtonText}>
                {sendingNotifications ? 'Sending...' : `Send to ${selectedMembers.size}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RefreshHeader
        title="Notifications Management"
        subtitle={`${notifications.length} total notifications`}
        onRefresh={onRefresh}
        showBackButton={true}
        gradientColors={['#FF6B35', '#F7931E']}
      />

      {environmentInfo.isExpoGo && (
        <View style={styles.expoGoInfo}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.expoGoInfoText}>
            Expo Go Mode: Local notifications only. Create a development build for full push notifications.
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowRenewalModal(true)}>
          <Ionicons name="notifications-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>
            Send Renewal Notifications ({membersNeedingRenewal.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.customActionButton]} onPress={() => setShowCustomModal(true)}>
          <Ionicons name="create-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Send Custom Notifications</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyMessage}>No notifications have been sent yet.</Text>
          </View>
        }
      />

      {renderRenewalModal()}
      {renderCustomModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expoGoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  expoGoInfoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1976D2',
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  customActionButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  notificationsList: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#C7C7CC',
    marginBottom: 4,
  },
  notificationUser: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  membershipInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  membershipInfoText: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 2,
  },
  daysUntilExpiry: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  urgent: {
    color: '#FF3B30',
  },
  warning: {
    color: '#FF9500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  largeModalContainer: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  expoGoWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  expoGoWarningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
  },
  modalDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    gap: 6,
  },
  selectedTypeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  selectedTypeButtonText: {
    color: 'white',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  memberSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  selectionButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  membersList: {
    maxHeight: 200,
  },
  memberItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  selectedMemberItem: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  memberItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  memberEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  memberStatus: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  memberSelection: {
    marginLeft: 12,
  },
  membersListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  memberTextItem: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  sendButton: {
    flex: 1,
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AdminNotificationsScreen; 