import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ArweaveStorageInfoProps {
  transactionId?: string
  status?: 'pending' | 'confirmed' | 'failed'
  timestamp?: string
  onViewTransaction?: (transactionId: string) => void
}

const ArweaveStorageInfo: React.FC<ArweaveStorageInfoProps> = ({
  transactionId,
  status = 'pending',
  timestamp,
  onViewTransaction
}) => {
  if (!transactionId) {
    return (
      <Card className="w-full bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Arweave Storage</CardTitle>
          <CardDescription className="text-xs">Permanent decentralized storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm">Not stored on Arweave yet</span>
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

  const { icon, text, color } = statusDisplay[status]

  const truncatedId = transactionId.length > 12 
    ? `${transactionId.substring(0, 6)}...${transactionId.substring(transactionId.length - 6)}` 
    : transactionId

  const formattedDate = timestamp 
    ? new Date(timestamp).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : 'Unknown date'

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">Arweave Storage</CardTitle>
          <Badge variant="outline" className={`text-xs ${color}`}>
            <span className="flex items-center gap-1">
              {icon}
              {text}
            </span>
          </Badge>
        </div>
        <CardDescription className="text-xs">Permanent decentralized storage</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Transaction ID:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs font-mono bg-muted/30 px-2 py-1 rounded">{truncatedId}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-mono text-xs">{transactionId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {timestamp && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Stored on:</span>
              <span className="text-xs">{formattedDate}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs h-8" 
          onClick={() => onViewTransaction && onViewTransaction(transactionId)}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View on Arweave Explorer
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ArweaveStorageInfo