import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, CheckCircle, XCircle, Clock, Database } from 'lucide-react'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface MongoDBStorageInfoProps {
  documentId?: string
  status?: 'pending' | 'confirmed' | 'failed'
  timestamp?: string
}

const MongoDBStorageInfo: React.FC<MongoDBStorageInfoProps> = ({
  documentId,
  status = 'pending',
  timestamp,
}) => {
  if (!documentId) {
    return (
      <Card className="w-full bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">MongoDB Storage</CardTitle>
          <CardDescription className="text-xs">Secure database storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Not stored in MongoDB yet</span>
            <Badge variant="outline" className="text-xs bg-muted/50">
              Not Available
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusDisplay = {
    pending: {
      icon: <Clock className="h-4 w-4 text-yellow-500" />,
      text: 'Pending',
      color: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
    },
    confirmed: {
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      text: 'Confirmed',
      color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
    },
    failed: {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
      text: 'Failed',
      color: 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
    }
  }

  const formattedDate = timestamp 
    ? new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown';

  return (
    <Card className="w-full bg-concordia-light-purple/10 border-concordia-light-purple/30">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <Database className="h-4 w-4 text-concordia-pink" />
          <CardTitle className="text-sm font-medium">MongoDB Storage</CardTitle>
        </div>
        <CardDescription className="text-xs">Secure database storage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge 
              variant="outline" 
              className={`text-xs ${statusDisplay[status].color}`}
            >
              <span className="flex items-center">
                {statusDisplay[status].icon}
                <span className="ml-1">{statusDisplay[status].text}</span>
              </span>
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Document ID:</span>
            <span className="text-xs font-mono bg-muted/30 px-1.5 py-0.5 rounded">
              {documentId.substring(0, 8)}...{documentId.substring(documentId.length - 8)}
            </span>
          </div>
          
          {timestamp && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Timestamp:</span>
              <span className="text-xs">{formattedDate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default MongoDBStorageInfo